import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import 'api_endpoints.dart';

/// Central Network API Client connecting to 24/7 Cloudflare Pages D1 Edge Backend & Local Server
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  // Session token lives in platform secure storage (Keychain/Keystore), never
  // in plaintext SharedPreferences, so a local attacker can't read it.
  static const _secureStorage = FlutterSecureStorage();
  static const _tokenKey = 'pocketsly_session_token';

  String? _sessionToken;
  UserModel? _currentUser;
  final ValueNotifier<UserModel?> currentUserNotifier = ValueNotifier<UserModel?>(null);

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionToken = await _secureStorage.read(key: _tokenKey);

    // Restore custom base URL if previously saved
    final customBaseUrl = prefs.getString('pocketsly_base_url');
    if (customBaseUrl != null && customBaseUrl.isNotEmpty) {
      ApiEndpoints.baseUrl = customBaseUrl;
    }

    // Restore cached user profile if available
    final cachedUserJson = prefs.getString('pocketsly_user_data');
    if (cachedUserJson != null) {
      try {
        final decoded = jsonDecode(cachedUserJson);
        if (decoded is Map<String, dynamic>) {
          _currentUser = UserModel.fromJson(decoded);
          currentUserNotifier.value = _currentUser;
        }
      } catch (_) {}
    }

    // Validate session with the backend asynchronously
    await checkSession();
  }

  Map<String, String> get _headers {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_sessionToken != null && _sessionToken!.isNotEmpty) {
      map['Cookie'] = 'session_id=$_sessionToken';
    }
    return map;
  }

  Future<void> _extractCookies(http.Response response) async {
    final rawCookie = response.headers['set-cookie'] ?? response.headers['Set-Cookie'];
    if (rawCookie != null) {
      final parts = rawCookie.split(';');
      for (final part in parts) {
        final trimmed = part.trim();
        if (trimmed.startsWith('session_id=') || trimmed.startsWith('session=')) {
          final val = trimmed.split('=').sublist(1).join('=');
          if (val.isNotEmpty) {
            _sessionToken = val;
            await _secureStorage.write(key: _tokenKey, value: val);
          }
          break;
        }
      }
    }
  }

  Future<void> setBaseUrl(String url) async {
    final normalized = ApiEndpoints.normalizeBaseUrl(url);
    ApiEndpoints.baseUrl = normalized;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pocketsly_base_url', normalized);
  }

  /// Parses technical network exceptions into human-friendly error messages
  String _humanizeError(dynamic error, String url) {
    final errStr = error.toString().toLowerCase();
    Uri? uri;
    try {
      uri = Uri.parse(url);
    } catch (_) {}
    final host = uri?.host ?? url;

    if (errStr.contains('failed host lookup') || errStr.contains('no address associated with hostname') || errStr.contains('socketexception')) {
      return "Cannot reach '$host'. Failed host lookup (DNS not found). If developing locally or using Android emulator, switch server to Localhost (10.0.2.2:8000).";
    }
    if (errStr.contains('connection refused') || errStr.contains('errno = 111')) {
      return "Connection refused by '$host'. Ensure your backend server (python server.py) is running on port 8000.";
    }
    if (errStr.contains('timed out') || errStr.contains('timeoutexception')) {
      return "Connection to '$host' timed out. Please check your network or Wi-Fi connection.";
    }
    if (errStr.contains('handshake') || errStr.contains('certificate')) {
      return "SSL/TLS handshake failed with '$host'. Please verify SSL certificate or use http:// for local servers.";
    }
    return "Network error connecting to '$host': $error";
  }

  /// Tests connectivity and latency to an API base URL (defaults to active base URL)
  Future<Map<String, dynamic>> testConnection([String? targetBaseUrl]) async {
    final base = ApiEndpoints.normalizeBaseUrl(targetBaseUrl ?? ApiEndpoints.baseUrl);
    final stopwatch = Stopwatch()..start();

    try {
      // 1. Try health endpoint
      final healthUri = Uri.parse('$base/health');
      final res = await http.get(healthUri, headers: {'Accept': 'application/json'}).timeout(const Duration(seconds: 4));
      stopwatch.stop();

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return {
          'success': true,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'message': 'Connected (${res.statusCode} OK • ${stopwatch.elapsedMilliseconds}ms)',
          'url': base,
        };
      }

      // 2. Fallback to /session
      final sessionUri = Uri.parse('$base/session');
      final sRes = await http.get(sessionUri, headers: {'Accept': 'application/json'}).timeout(const Duration(seconds: 4));
      if (sRes.statusCode >= 200 && sRes.statusCode < 400) {
        return {
          'success': true,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'message': 'Connected (${sRes.statusCode} OK • ${stopwatch.elapsedMilliseconds}ms)',
          'url': base,
        };
      }

      return {
        'success': false,
        'latencyMs': stopwatch.elapsedMilliseconds,
        'message': 'Server responded with HTTP status ${res.statusCode}',
        'url': base,
      };
    } catch (e) {
      stopwatch.stop();
      return {
        'success': false,
        'latencyMs': stopwatch.elapsedMilliseconds,
        'message': _humanizeError(e, base),
        'url': base,
      };
    }
  }

  // ── Authentication Endpoints ───────────────────────────────────────────────

  /// Enters Demo / Offline Mode with sample data
  Future<void> loginAsDemoUser() async {
    final demoUser = UserModel(
      id: 999,
      username: 'alex_demo',
      email: 'alex.demo@pocketsly.app',
      phone: '+1 555-0199',
    );
    _currentUser = demoUser;
    currentUserNotifier.value = demoUser;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pocketsly_user_data', jsonEncode(demoUser.toJson()));
  }

  /// Checks if active session is valid on backend
  Future<bool> checkSession() async {
    try {
      final res = await get(ApiEndpoints.session);
      if (res is Map && res['authenticated'] == true && res['user'] != null) {
        _currentUser = UserModel.fromJson(res['user']);
        currentUserNotifier.value = _currentUser;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('pocketsly_user_data', jsonEncode(res['user']));
        return true;
      } else {
        // Only clear if not in offline demo mode
        if (_currentUser?.id != 999) {
          _currentUser = null;
          currentUserNotifier.value = null;
        }
        return false;
      }
    } catch (_) {
      return false;
    }
  }

  /// Sign In with username and password
  Future<Map<String, dynamic>> login(String username, String password) async {
    final res = await post(ApiEndpoints.login, {
      'username': username.trim(),
      'password': password,
    });

    if (res is Map<String, dynamic> && res['success'] == true && res['user'] != null) {
      _currentUser = UserModel.fromJson(res['user']);
      currentUserNotifier.value = _currentUser;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pocketsly_user_data', jsonEncode(res['user']));
      return {'success': true, 'user': _currentUser};
    }

    final err = (res is Map && res['error'] != null)
        ? res['error']
        : 'Sign in failed. Please check your credentials.';
    return {'success': false, 'error': err};
  }

  /// Register a new account
  Future<Map<String, dynamic>> register({
    required String username,
    required String password,
    String? email,
    String? phone,
  }) async {
    final res = await post(ApiEndpoints.register, {
      'username': username.trim(),
      'password': password,
      if (email != null && email.isNotEmpty) 'email': email.trim(),
      if (phone != null && phone.isNotEmpty) 'phone': phone.trim(),
    });

    if (res is Map<String, dynamic> && res['success'] == true && res['user'] != null) {
      _currentUser = UserModel.fromJson(res['user']);
      currentUserNotifier.value = _currentUser;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pocketsly_user_data', jsonEncode(res['user']));
      return {'success': true, 'user': _currentUser};
    }

    final err = (res is Map && res['error'] != null)
        ? res['error']
        : 'Registration failed. Username may already exist.';
    return {'success': false, 'error': err};
  }

  /// Request 6-digit OTP code for password reset
  Future<Map<String, dynamic>> requestOtp(String usernameOrEmail) async {
    final res = await post(ApiEndpoints.requestOtp, {
      'username': usernameOrEmail.trim(),
      'email': usernameOrEmail.trim(),
    });
    if (res is Map<String, dynamic>) {
      final err = res['error'] as String? ?? '';
      if (err.contains('RESEND_API_KEY') || err.contains('Email delivery is not configured')) {
        res['error'] = 'Password recovery email isn\'t enabled yet. Ask the admin to set RESEND_API_KEY and MAIL_FROM.';
      }
      return res;
    }
    return {'error': 'Failed to request OTP'};
  }

  /// Reset Password with OTP verification
  Future<Map<String, dynamic>> resetPassword({
    required String username,
    required String otpCode,
    required String newPassword,
  }) async {
    final res = await post(ApiEndpoints.resetPassword, {
      'username': username.trim(),
      'otp_code': otpCode.trim(),
      'new_password': newPassword,
    });
    return (res is Map<String, dynamic>) ? res : {'error': 'Failed to reset password'};
  }

  /// Update user profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await post(ApiEndpoints.profile, data);
    if (res is Map<String, dynamic> && res['success'] == true) {
      if (res['user'] != null) {
        _currentUser = UserModel.fromJson(res['user']);
        currentUserNotifier.value = _currentUser;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('pocketsly_user_data', jsonEncode(res['user']));
      }
      return {'success': true};
    }
    return {'success': false, 'error': res['error'] ?? 'Failed to update profile'};
  }

  /// Logout and clear cached session
  Future<void> logout() async {
    try {
      await post(ApiEndpoints.logout, {});
    } catch (_) {}
    _sessionToken = null;
    _currentUser = null;
    currentUserNotifier.value = null;
    await _secureStorage.delete(key: _tokenKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('pocketsly_user_data');
  }

  // ── Generic HTTP Methods with Timeout and Humanized Errors ─────────────────

  Future<dynamic> get(String url) async {
    try {
      final res = await http.get(Uri.parse(url), headers: _headers).timeout(const Duration(seconds: 8));
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': _humanizeError(e, url)};
    }
  }

  Future<dynamic> post(String url, Map<String, dynamic> body) async {
    try {
      final res = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': _humanizeError(e, url)};
    }
  }

  Future<dynamic> patch(String url, Map<String, dynamic> body) async {
    try {
      final res = await http.patch(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': _humanizeError(e, url)};
    }
  }

  Future<dynamic> delete(String url) async {
    try {
      final res = await http.delete(Uri.parse(url), headers: _headers).timeout(const Duration(seconds: 8));
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': _humanizeError(e, url)};
    }
  }
}
