import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_endpoints.dart';

/// Network API Client connecting to 24/7 Cloudflare Pages D1 Backend
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  String? _sessionCookie;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionCookie = prefs.getString('pocketsly_session_cookie');
  }

  Map<String, String> get _headers {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_sessionCookie != null) {
      map['Cookie'] = _sessionCookie!;
    }
    return map;
  }

  void _extractCookies(http.Response response) async {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie != null && rawCookie.contains('session=')) {
      final sessionPart = rawCookie.split(';').firstWhere((s) => s.trim().startsWith('session='));
      _sessionCookie = sessionPart;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pocketsly_session_cookie', sessionPart);
    }
  }

  Future<dynamic> get(String url) async {
    try {
      final res = await http.get(Uri.parse(url), headers: _headers);
      _extractCookies(res);
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
      _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': 'Network connection failed: $e'};
    }
  }

  Future<dynamic> delete(String url) async {
    try {
      final res = await http.delete(Uri.parse(url), headers: _headers);
      _extractCookies(res);
      return jsonDecode(res.body);
    } catch (e) {
      return {'error': 'Network connection failed: $e'};
    }
  }
}
