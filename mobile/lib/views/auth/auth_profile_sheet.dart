import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';

class AuthProfileSheet extends StatefulWidget {
  final VoidCallback onStateChanged;

  const AuthProfileSheet({super.key, required this.onStateChanged});

  static Future<void> show(BuildContext context, {required VoidCallback onStateChanged}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => AuthProfileSheet(onStateChanged: onStateChanged),
    );
  }

  @override
  State<AuthProfileSheet> createState() => _AuthProfileSheetState();
}

class _AuthProfileSheetState extends State<AuthProfileSheet> {
  // Guest Form Tabs: 'login', 'register', 'forgot'
  String _guestTab = 'login';
  bool _isLoading = false;
  bool _isTestingPing = false;
  bool _showServerConfig = false;
  String? _errorMessage;
  String? _successMessage;
  String? _pingResult;
  bool? _pingSuccess;

  // Controllers for Login
  final TextEditingController _loginUsernameController = TextEditingController();
  final TextEditingController _loginPasswordController = TextEditingController();

  // Controllers for Register
  final TextEditingController _regUsernameController = TextEditingController();
  final TextEditingController _regEmailController = TextEditingController();
  final TextEditingController _regPhoneController = TextEditingController();
  final TextEditingController _regPasswordController = TextEditingController();

  // Controllers for Forgot Password
  final TextEditingController _forgotUsernameController = TextEditingController();
  final TextEditingController _forgotOtpController = TextEditingController();
  final TextEditingController _forgotNewPasswordController = TextEditingController();
  final TextEditingController _forgotConfirmPasswordController = TextEditingController();

  // Controllers for Edit Profile (Signed In)
  final TextEditingController _profUsernameController = TextEditingController();
  final TextEditingController _profEmailController = TextEditingController();
  final TextEditingController _profPhoneController = TextEditingController();

  // Controller for Custom Server Base URL
  final TextEditingController _customServerController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = ApiClient.instance.currentUser;
    if (user != null) {
      _profUsernameController.text = user.username;
      _profEmailController.text = user.email;
      _profPhoneController.text = user.phone;
    }
    _customServerController.text = ApiEndpoints.baseUrl;
  }

  void _clearFeedback() {
    setState(() {
      _errorMessage = null;
      _successMessage = null;
      _pingResult = null;
      _pingSuccess = null;
    });
  }

  // ── Server Switching & Diagnostics ────────────────────────────────────────

  Future<void> _handleSwitchServer(String url) async {
    final normalized = ApiEndpoints.normalizeBaseUrl(url);
    await ApiClient.instance.setBaseUrl(normalized);
    _customServerController.text = normalized;
    setState(() {
      _errorMessage = null;
      _successMessage = 'API server changed to $normalized';
    });
    await _handleTestPing(normalized);
  }

  Future<void> _handleTestPing([String? url]) async {
    setState(() {
      _isTestingPing = true;
      _pingResult = null;
    });

    final target = url ?? _customServerController.text.trim();
    final res = await ApiClient.instance.testConnection(target);

    if (mounted) {
      setState(() {
        _isTestingPing = false;
        _pingSuccess = res['success'] == true;
        _pingResult = res['message'];
      });
    }
  }

  Future<void> _handleEnterDemoMode() async {
    await ApiClient.instance.loginAsDemoUser();
    widget.onStateChanged();
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.primary,
          content: Text('Entered Offline Demo Mode! Explore all features.'),
        ),
      );
    }
  }

  // ── Auth Handlers ─────────────────────────────────────────────────────────

  Future<void> _handleLogin() async {
    final username = _loginUsernameController.text.trim();
    final password = _loginPasswordController.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter both username and password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiClient.instance.login(username, password);

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        widget.onStateChanged();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            content: Text('Welcome back, ${ApiClient.instance.currentUser?.username}!'),
          ),
        );
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Sign in failed');
      }
    }
  }

  Future<void> _handleRegister() async {
    final username = _regUsernameController.text.trim();
    final password = _regPasswordController.text;
    final email = _regEmailController.text.trim();
    final phone = _regPhoneController.text.trim();

    if (username.length < 3) {
      setState(() => _errorMessage = 'Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiClient.instance.register(
      username: username,
      password: password,
      email: email,
      phone: phone,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        widget.onStateChanged();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            content: Text('Account created! Welcome, ${ApiClient.instance.currentUser?.username}!'),
          ),
        );
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Registration failed');
      }
    }
  }

  Future<void> _handleSendOtp() async {
    final query = _forgotUsernameController.text.trim();
    if (query.isEmpty) {
      setState(() => _errorMessage = 'Enter your Username or Registered Email first.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiClient.instance.requestOtp(query);

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        final otp = res['otp_code'] ?? '';
        _forgotOtpController.text = otp;
        setState(() => _successMessage = 'OTP generated! Code: $otp');
      } else {
        setState(() => _errorMessage = res['error'] ?? 'No account found with provided info.');
      }
    }
  }

  Future<void> _handleResetPassword() async {
    final username = _forgotUsernameController.text.trim();
    final otp = _forgotOtpController.text.trim();
    final newPass = _forgotNewPasswordController.text;
    final confirmPass = _forgotConfirmPasswordController.text;

    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter the 6-digit OTP code.');
      return;
    }
    if (newPass != confirmPass) {
      setState(() => _errorMessage = 'Passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiClient.instance.resetPassword(
      username: username,
      otpCode: otp,
      newPassword: newPass,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        _loginUsernameController.text = username;
        setState(() {
          _guestTab = 'login';
          _successMessage = 'Password reset successfully! Please sign in.';
        });
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Failed to reset password.');
      }
    }
  }

  Future<void> _handleUpdateProfile() async {
    final username = _profUsernameController.text.trim();
    final email = _profEmailController.text.trim();
    final phone = _profPhoneController.text.trim();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final body = <String, dynamic>{
      'username': username,
      'email': email,
      'phone': phone,
    };

    final res = await ApiClient.instance.updateProfile(body);

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        widget.onStateChanged();
        setState(() => _successMessage = 'Profile updated successfully!');
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Update failed.');
      }
    }
  }

  Future<void> _handleLogout() async {
    await ApiClient.instance.logout();
    widget.onStateChanged();
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Logged out successfully.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isAuth = ApiClient.instance.isAuthenticated;
    final user = ApiClient.instance.currentUser;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: bottomInset + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Handle
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Modal Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.person_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      isAuth ? 'Profile & Server Settings' : 'Pocketsly Authentication',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                  iconSize: 20,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Alert Messages (Error / Success)
            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.danger.withAlpha(25),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.danger.withAlpha(80)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: AppColors.danger, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    if (_errorMessage!.contains('Cannot reach') || _errorMessage!.contains('Connection refused') || _errorMessage!.contains('host lookup')) ...[
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => _handleSwitchServer(ApiEndpoints.emulatorBaseUrl),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primaryLight,
                              side: const BorderSide(color: AppColors.primary),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(Icons.android_rounded, size: 14),
                            label: const Text('Switch to Emulator (10.0.2.2:8000)', style: TextStyle(fontSize: 11)),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => _handleSwitchServer(ApiEndpoints.localhostBaseUrl),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.cyan,
                              side: const BorderSide(color: AppColors.cyan),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(Icons.computer_rounded, size: 14),
                            label: const Text('Switch to 127.0.0.1:8000', style: TextStyle(fontSize: 11)),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            if (_successMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(25),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.success.withAlpha(80)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline_rounded, color: AppColors.success, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_successMessage!, style: const TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // ── Server Connection Status Strip (Always Accessible) ───────────
            _buildServerStatusStrip(),
            const SizedBox(height: 14),

            // Main Body Content
            if (isAuth && user != null)
              _buildSignedInView(user)
            else
              _buildGuestView(),
          ],
        ),
      ),
    );
  }

  // ── SERVER STATUS STRIP & CONFIG PANEL ────────────────────────────────────
  Widget _buildServerStatusStrip() {
    final activeUrl = ApiEndpoints.baseUrl;
    final isEmulator = activeUrl.contains('10.0.2.2');
    final isLocalhost = activeUrl.contains('127.0.0.1') || activeUrl.contains('localhost');
    final isCloud = activeUrl.contains('pages.dev');

    String presetBadge = 'Custom Server';
    Color badgeColor = AppColors.cyan;
    if (isCloud) {
      presetBadge = 'Cloud 24/7';
      badgeColor = AppColors.primaryLight;
    } else if (isEmulator) {
      presetBadge = 'Android Emulator';
      badgeColor = AppColors.success;
    } else if (isLocalhost) {
      presetBadge = 'Localhost (127.0.0.1)';
      badgeColor = AppColors.warning;
    }

    return GlassCard(
      padding: const EdgeInsets.all(12),
      borderRadius: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _pingSuccess == true ? AppColors.success : (_pingSuccess == false ? AppColors.danger : badgeColor),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (_pingSuccess == true ? AppColors.success : badgeColor).withAlpha(150),
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    presetBadge,
                    style: TextStyle(color: badgeColor, fontSize: 12, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              InkWell(
                onTap: () => setState(() => _showServerConfig = !_showServerConfig),
                borderRadius: BorderRadius.circular(6),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _showServerConfig ? 'Hide Config' : 'Change Server ⚙️',
                        style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                      Icon(
                        _showServerConfig ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                        color: AppColors.primaryLight,
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            activeUrl,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontFamily: 'monospace'),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          // Ping status banner
          if (_pingResult != null) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: (_pingSuccess == true ? AppColors.success : AppColors.danger).withAlpha(25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    _pingSuccess == true ? Icons.check_circle_rounded : Icons.cancel_rounded,
                    color: _pingSuccess == true ? AppColors.success : AppColors.danger,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      _pingResult!,
                      style: TextStyle(
                        color: _pingSuccess == true ? AppColors.success : AppColors.danger,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Expandable Config Drawer
          if (_showServerConfig) ...[
            const Divider(color: AppColors.border, height: 18),
            const Text(
              'Select API Host Preset:',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildPresetButton('Cloud Edge', ApiEndpoints.productionBaseUrl, Icons.cloud_queue_rounded),
                _buildPresetButton('10.0.2.2 (Emulator)', ApiEndpoints.emulatorBaseUrl, Icons.android_rounded),
                _buildPresetButton('127.0.0.1 (Local)', ApiEndpoints.localhostBaseUrl, Icons.computer_rounded),
              ],
            ),
            const SizedBox(height: 10),

            // Custom Base URL input
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _customServerController,
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                    decoration: const InputDecoration(
                      hintText: 'http://192.168.1.5:8000/api',
                      labelText: 'Custom Server URL',
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _handleSwitchServer(_customServerController.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Save', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Ping Test Button
            OutlinedButton.icon(
              onPressed: _isTestingPing ? null : () => _handleTestPing(),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: _isTestingPing
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight))
                  : const Icon(Icons.network_ping_rounded, size: 16),
              label: Text(_isTestingPing ? 'Testing Connection...' : 'Test Connection / Ping', style: const TextStyle(fontSize: 11)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPresetButton(String label, String url, IconData icon) {
    final isSelected = ApiEndpoints.baseUrl == url;
    return ChoiceChip(
      avatar: Icon(icon, size: 14, color: isSelected ? Colors.white : AppColors.textSecondary),
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
      selected: isSelected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.bgSurfaceAlt,
      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
      onSelected: (_) => _handleSwitchServer(url),
    );
  }

  // ── SIGNED-IN PROFILE VIEW ────────────────────────────────────────────────
  Widget _buildSignedInView(UserModel user) {
    final isDemo = user.id == 999;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // User Strip Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.primary.withAlpha(40)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: isDemo ? AppColors.warning : AppColors.primary,
                child: Text(
                  user.username.isNotEmpty ? user.username[0].toUpperCase() : 'U',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.username,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.email.isNotEmpty ? user.email : (isDemo ? 'Offline Demo Session' : 'Synchronized User Account'),
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (isDemo ? AppColors.warning : AppColors.success).withAlpha(30),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isDemo ? 'Demo Mode' : 'Online',
                  style: TextStyle(
                    color: isDemo ? AppColors.warning : AppColors.success,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Profile Form
        const Text('Account Information', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),

        TextField(
          controller: _profUsernameController,
          decoration: const InputDecoration(labelText: 'Username'),
        ),
        const SizedBox(height: 10),

        TextField(
          controller: _profEmailController,
          decoration: const InputDecoration(labelText: 'Recovery Email'),
        ),
        const SizedBox(height: 10),

        TextField(
          controller: _profPhoneController,
          decoration: const InputDecoration(labelText: 'Recovery Phone Number'),
        ),
        const SizedBox(height: 14),

        ElevatedButton(
          onPressed: _isLoading ? null : _handleUpdateProfile,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 13),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: _isLoading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Save Profile Changes', style: TextStyle(fontWeight: FontWeight.w700)),
        ),
        const SizedBox(height: 16),

        // Sign Out Button
        ElevatedButton.icon(
          onPressed: _handleLogout,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger.withAlpha(25),
            foregroundColor: AppColors.danger,
            elevation: 0,
            side: BorderSide(color: AppColors.danger.withAlpha(80)),
            padding: const EdgeInsets.symmetric(vertical: 13),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: const Icon(Icons.logout_rounded, size: 18),
          label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }

  // ── GUEST AUTHENTICATION VIEW ─────────────────────────────────────────────
  Widget _buildGuestView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Sub-tabs switcher
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              _buildGuestTabBtn('login', 'Sign In'),
              _buildGuestTabBtn('register', 'Register'),
              _buildGuestTabBtn('forgot', 'Forgot Password'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (_guestTab == 'login') ...[
          // SIGN IN FORM
          TextField(
            controller: _loginUsernameController,
            decoration: const InputDecoration(
              labelText: 'Username',
              hintText: 'e.g. alex_student',
              prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _loginPasswordController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Password',
              hintText: '••••••••',
              prefixIcon: Icon(Icons.lock_outline_rounded, size: 20),
            ),
          ),
          const SizedBox(height: 6),

          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => setState(() => _guestTab = 'forgot'),
              child: const Text('Forgot Password?', style: TextStyle(color: AppColors.primaryLight, fontSize: 12)),
            ),
          ),
          const SizedBox(height: 6),

          ElevatedButton(
            onPressed: _isLoading ? null : _handleLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Sign In to Pocketsly', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          ),
          const SizedBox(height: 12),

          // Offline Demo Mode Button
          OutlinedButton.icon(
            onPressed: _handleEnterDemoMode,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.cyan,
              side: const BorderSide(color: AppColors.cyan),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            icon: const Icon(Icons.explore_outlined, size: 18),
            label: const Text('Explore in Offline Demo Mode', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ] else if (_guestTab == 'register') ...[
          // REGISTER FORM
          TextField(
            controller: _regUsernameController,
            decoration: const InputDecoration(labelText: 'Username', hintText: 'e.g. alex_student'),
          ),
          const SizedBox(height: 10),

          TextField(
            controller: _regEmailController,
            decoration: const InputDecoration(labelText: 'Email Address (for password recovery)', hintText: 'alex@example.com'),
          ),
          const SizedBox(height: 10),

          TextField(
            controller: _regPhoneController,
            decoration: const InputDecoration(labelText: 'Phone Number (Optional)', hintText: '+62812345678'),
          ),
          const SizedBox(height: 10),

          TextField(
            controller: _regPasswordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password (min. 6 characters)', hintText: '••••••••'),
          ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: _isLoading ? null : _handleRegister,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Create Account', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          ),
        ] else ...[
          // FORGOT PASSWORD / OTP FORM
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _forgotUsernameController,
                  decoration: const InputDecoration(
                    labelText: 'Username or Email',
                    hintText: 'Enter username/email',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSendOtp,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.bgSurfaceAlt,
                  foregroundColor: AppColors.primaryLight,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Get OTP', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 10),

          TextField(
            controller: _forgotOtpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: const InputDecoration(labelText: '6-Digit OTP Code', hintText: 'Enter 6-digit code'),
          ),
          const SizedBox(height: 6),

          TextField(
            controller: _forgotNewPasswordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'New Password', hintText: '••••••••'),
          ),
          const SizedBox(height: 10),

          TextField(
            controller: _forgotConfirmPasswordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Confirm New Password', hintText: '••••••••'),
          ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: _isLoading ? null : _handleResetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Verify OTP & Reset Password', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          ),
        ],
      ],
    );
  }

  Widget _buildGuestTabBtn(String tab, String label) {
    final isActive = _guestTab == tab;
    return Expanded(
      child: InkWell(
        onTap: () {
          _clearFeedback();
          setState(() => _guestTab = tab);
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isActive ? Colors.white : AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}
