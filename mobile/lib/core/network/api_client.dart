import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import 'api_endpoints.dart';

/// Central Network API Client connecting to 24/7 Cloudflare Pages D1 Edge Backend & Local Server
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  String? _sessionToken;
  UserModel? _currentUser;
  final ValueNotifier<UserModel?> currentUserNotifier = ValueNotifier<UserModel?>(null);

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionToken = prefs.getString('pocketsly_session_token');
    
    // Restore custom base URL if set
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

    // Validate session with the backend
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
    // Check both lowercase and titlecase header keys
    final rawCookie = response.headers['set-cookie'] ?? response.headers['Set-Cookie'];
    if (rawCookie != null) {
      // Look for session_id= or session=
      final parts = rawCookie.split(';');
      for (final part in parts) {
        final trimmed = part.trim();
        if (trimmed.startsWith('session_id=') || trimmed.startsWith('session=')) {
          final val = trimmed.split('=').sublist(1).join('=');
          if (val.isNotEmpty) {
            _sessionToken = val;
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('pocketsly_session_token', val);
          }
          break;
        }
      }
    }
  }

  Future<void> setBaseUrl(String url) async {
    ApiEndpoints.baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pocketsly_base_url', url);
  }

  // ── Authentication Endpoints ───────────────────────────────────────────────

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
        _currentUser = null;
        currentUserNotifier.value = null;
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

    return {'success': false, 'error': res['error'] ?? 'Sign in failed. Please check credentials.'};
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

    return {'success': false, 'error': res['error'] ?? 'Registration failed. Username may already exist.'};
  }

  /// Request 6-digit OTP code for password reset
  Future<Map<String, dynamic>> requestOtp(String usernameOrEmail) async {
    final res = await post(ApiEndpoints.requestOtp, {
      'username': usernameOrEmail.trim(),
      'email': usernameOrEmail.trim(),
    });
    return (res is Map<String, dynamic>) ? res : {'error': 'Failed to request OTP'};
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('pocketsly_session_token');
    await prefs.remove('pocketsly_user_data');
  }

  // ── Generic HTTP Methods ───────────────────────────────────────────────────

  Future<dynamic> get(String url) async {
    try {
      final res = await http.get(Uri.parse(url), headers: _headers);
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': 'Network connection failed: $e'};
    }
  }

  Future<dynamic> post(String url, Map<String, dynamic> body) async {
    try {
      final res = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(body),
      );
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': 'Network connection failed: $e'};
    }
  }

  Future<dynamic> patch(String url, Map<String, dynamic> body) async {
    try {
      final res = await http.patch(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(body),
      );
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': 'Network connection failed: $e'};
    }
  }

  Future<dynamic> delete(String url) async {
    try {
      final res = await http.delete(Uri.parse(url), headers: _headers);
      await _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': 'Network connection failed: $e'};
    }
  }
}
