import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/design_system.dart';
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
      backgroundColor: Colors.transparent,
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

  @override
  void dispose() {
    _loginUsernameController.dispose();
    _loginPasswordController.dispose();
    _regUsernameController.dispose();
    _regEmailController.dispose();
    _regPhoneController.dispose();
    _regPasswordController.dispose();
    _forgotUsernameController.dispose();
    _forgotOtpController.dispose();
    _forgotNewPasswordController.dispose();
    _forgotConfirmPasswordController.dispose();
    _profUsernameController.dispose();
    _profEmailController.dispose();
    _profPhoneController.dispose();
    _customServerController.dispose();
    super.dispose();
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
        SnackBar(
          backgroundColor: AppSemanticColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
          content: const Text('Entered Offline Demo Mode! Explore all features.'),
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
            backgroundColor: AppSemanticColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
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
            backgroundColor: AppSemanticColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
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
        _forgotOtpController.clear();
        setState(() => _successMessage = res['message'] ?? 'Recovery code sent to your email.');
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
      setState(() => _errorMessage = 'New password must be at least 6 characters.');
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
        widget.onStateChanged();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppSemanticColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
            content: const Text('Password reset successful. You can now sign in.'),
          ),
        );
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Reset failed');
      }
    }
  }

  Future<void> _handleUpdateProfile() async {
    final username = _profUsernameController.text.trim();
    final email = _profEmailController.text.trim();
    final phone = _profPhoneController.text.trim();

    if (username.isEmpty) {
      setState(() => _errorMessage = 'Username cannot be empty.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiClient.instance.updateProfile({
      'username': username,
      'email': email,
      'phone': phone,
    });

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        setState(() => _successMessage = 'Profile updated successfully');
        widget.onStateChanged();
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Update failed');
      }
    }
  }

  Future<void> _handleExportBackup() async {
    final res = await ApiClient.instance.get(ApiEndpoints.backupExport);
    if (mounted) {
      if (res is Map && res['success'] == true && res['json'] != null) {
        final jsonString = const JsonEncoder.withIndent('  ').convert(res['json']);
        await Clipboard.setData(ClipboardData(text: jsonString));
        setState(() => _successMessage = 'Backup copied to clipboard. Save it securely.');
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Export failed');
      }
    }
  }

  void _openRestoreModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _RestoreModal(onRestore: widget.onStateChanged),
    );
  }

  Future<void> _handleLogout() async {
    await ApiClient.instance.logout();
    widget.onStateChanged();
    if (mounted) {
      Navigator.pop(context);
    }
  }

  // ── UI Builders ───────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final user = ApiClient.instance.currentUser;
    final isDemo = user?.isDemo == true;

    return Container(
      decoration: BoxDecoration(
        color: AppSemanticColors.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXxl)),
        boxShadow: AppElevation.level3,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag Handle
            Container(
              margin: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.xs),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppSemanticColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xs, AppSpacing.lg, AppSpacing.md),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      user != null ? 'Account' : 'Sign In to Pocketsly',
                      style: AppTypography.h3.copyWith(color: AppSemanticColors.textPrimary),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, size: 22),
                    color: AppSemanticColors.textSecondary,
                    tooltip: 'Close',
                    constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                  ),
                ],
              ),
            ),

            // Divider
            const Divider(height: 1, color: AppSemanticColors.border),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.modalPadding),
                child: user != null
                    ? _buildSignedInView(user, isDemo)
                    : _buildGuestView(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSignedInView(UserModel user, bool isDemo) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // User Avatar & Status
        GlassCard(
          padding: const EdgeInsets.all(AppSpacing.lg),
          margin: EdgeInsets.zero,
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppSemanticColors.primary.withAlpha(30),
                child: Text(
                  user.username.isNotEmpty ? user.username[0].toUpperCase() : '?',
                  style: AppTypography.h2.copyWith(
                    color: AppSemanticColors.primaryLight,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.username,
                      style: AppTypography.bodyLarge.copyWith(
                        color: AppSemanticColors.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.email.isNotEmpty
                          ? user.email
                          : (isDemo ? 'Offline Demo Session' : 'Synchronized User Account'),
                      style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textSecondary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (isDemo ? AppSemanticColors.warning : AppSemanticColors.success).withAlpha(30),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Text(
                  isDemo ? 'Demo Mode' : 'Online',
                  style: AppTypography.overline.copyWith(
                    color: isDemo ? AppSemanticColors.warning : AppSemanticColors.success,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.xl),

        // Profile Form
        Text('Account Information', style: AppTypography.sectionLabel.copyWith(color: AppSemanticColors.textSecondary)),
        const SizedBox(height: AppSpacing.md),

        _buildProfileField(
          controller: _profUsernameController,
          label: 'Username',
          hint: 'Your unique username',
          prefixIcon: Icons.person_outline_rounded,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildProfileField(
          controller: _profEmailController,
          label: 'Recovery Email',
          hint: 'you@example.com',
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildProfileField(
          controller: _profPhoneController,
          label: 'Recovery Phone',
          hint: '+62 8xx xxx xxxx',
          prefixIcon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: AppSpacing.lg),

        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleUpdateProfile,
            style: AppButtonStyles.primary(),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Save Profile Changes'),
          ),
        ),

        const SizedBox(height: AppSpacing.xl),

        // Data Backup & Disaster Recovery Section
        Text(
          'DATA BACKUP & RECOVERY',
          style: AppTypography.overline.copyWith(color: AppSemanticColors.textMuted),
        ),
        const SizedBox(height: AppSpacing.md),

        GlassCard(
          padding: const EdgeInsets.all(AppSpacing.lg),
          margin: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Export & Restore',
                style: AppTypography.subheading.copyWith(color: AppSemanticColors.textPrimary),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Keep a local copy of your data for disaster recovery. The backup contains all your habits, tasks, notes, curriculum, and budget entries.',
                style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isLoading ? null : _handleExportBackup,
                      style: AppButtonStyles.secondary().copyWith(
                        foregroundColor: WidgetStateProperty.all(AppSemanticColors.cyan),
                        side: WidgetStateProperty.all(const BorderSide(color: AppSemanticColors.cyan, width: 1.5)),
                      ),
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: const Text('Export JSON'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isLoading ? null : _openRestoreModal,
                      style: AppButtonStyles.secondary().copyWith(
                        foregroundColor: WidgetStateProperty.all(AppSemanticColors.orange),
                        side: WidgetStateProperty.all(const BorderSide(color: AppSemanticColors.orange, width: 1.5)),
                      ),
                      icon: const Icon(Icons.upload_rounded, size: 18),
                      label: const Text('Restore Data'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.xl),

        // Sign Out Button
        SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _handleLogout,
            style: AppButtonStyles.danger(),
            icon: const Icon(Icons.logout_rounded, size: 20),
            label: const Text('Sign Out'),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData prefixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: AppTypography.input.copyWith(color: AppSemanticColors.textPrimary),
      decoration: AppInputStyles.base(
        label: label,
        hint: hint,
        prefixIcon: Icon(prefixIcon, size: 20, color: AppSemanticColors.textSecondary),
      ),
    );
  }

  Widget _buildGuestView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Sub-tabs switcher
        Container(
          decoration: BoxDecoration(
            color: AppSemanticColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(color: AppSemanticColors.border, width: 1),
          ),
          child: Row(
            children: [
              _buildGuestTabBtn('login', 'Sign In'),
              _buildGuestTabBtn('register', 'Register'),
              _buildGuestTabBtn('forgot', 'Reset Password'),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        if (_guestTab == 'login') _buildLoginForm(),
        if (_guestTab == 'register') _buildRegisterForm(),
        if (_guestTab == 'forgot') _buildForgotForm(),
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
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: isActive ? AppSemanticColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTypography.button.copyWith(
              color: isActive ? Colors.white : AppSemanticColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildInputField(
          controller: _loginUsernameController,
          label: 'Username or Email',
          hint: 'alex_student or alex@example.com',
          prefixIcon: Icons.person_outline_rounded,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _loginPasswordController,
          label: 'Password',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: AppSpacing.sm),

        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () {
              _clearFeedback();
              setState(() => _guestTab = 'forgot');
            },
            style: AppButtonStyles.ghost(),
            child: const Text('Forgot Password?'),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),

        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleLogin,
            style: AppButtonStyles.primary(),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Sign In to Pocketsly'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Offline Demo Mode Button
        SizedBox(
          height: 52,
          child: OutlinedButton.icon(
            onPressed: _handleEnterDemoMode,
            style: AppButtonStyles.secondary().copyWith(
              foregroundColor: WidgetStateProperty.all(AppSemanticColors.cyan),
              side: WidgetStateProperty.all(const BorderSide(color: AppSemanticColors.cyan, width: 1.5)),
            ),
            icon: const Icon(Icons.explore_outlined, size: 20),
            label: const Text('Explore Offline Demo Mode'),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildInputField(
          controller: _regUsernameController,
          label: 'Username',
          hint: 'alex_student',
          prefixIcon: Icons.person_outline_rounded,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _regEmailController,
          label: 'Email Address',
          hint: 'alex@example.com',
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _regPhoneController,
          label: 'Phone Number (Optional)',
          hint: '+62 8xx xxx xxxx',
          prefixIcon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _regPasswordController,
          label: 'Password (min. 6 characters)',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: AppSpacing.lg),

        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleRegister,
            style: AppButtonStyles.primary(),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Create Account'),
          ),
        ),
      ],
    );
  }

  Widget _buildForgotForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: _buildInputField(
                controller: _forgotUsernameController,
                label: 'Username or Email',
                hint: 'Enter username or email',
                prefixIcon: Icons.person_outline_rounded,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleSendOtp,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppSemanticColors.bgSurfaceAlt,
                  foregroundColor: AppSemanticColors.primaryLight,
                  side: const BorderSide(color: AppSemanticColors.primary, width: 1.5),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  minimumSize: const Size(AppSpacing.minTouchTarget, AppSpacing.minTouchTarget),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  ),
                  textStyle: AppTypography.button,
                ),
                child: const Text('Get OTP'),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _forgotOtpController,
          label: '6-Digit OTP Code',
          hint: 'Enter 6-digit code',
          prefixIcon: Icons.pin_outlined,
          keyboardType: TextInputType.number,
          maxLength: 6,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _forgotNewPasswordController,
          label: 'New Password',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: AppSpacing.md),

        _buildInputField(
          controller: _forgotConfirmPasswordController,
          label: 'Confirm New Password',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: AppSpacing.lg),

        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleResetPassword,
            style: AppButtonStyles.primary(),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Verify OTP & Reset Password'),
          ),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData prefixIcon,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
    String? errorText,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLength: maxLength,
      style: AppTypography.input.copyWith(color: AppSemanticColors.textPrimary),
      decoration: errorText != null
          ? AppInputStyles.error(
              label: label,
              hint: hint,
              errorText: errorText,
              prefixIcon: Icon(prefixIcon, size: 20, color: AppSemanticColors.textSecondary),
            )
          : AppInputStyles.base(
              label: label,
              hint: hint,
              prefixIcon: Icon(prefixIcon, size: 20, color: AppSemanticColors.textSecondary),
            ),
      buildCounter: maxLength != null
          ? (context, {required currentLength, required isFocused, maxLength}) => null
          : null,
    );
  }
}

/// Restore Modal
class _RestoreModal extends StatefulWidget {
  final VoidCallback onRestore;

  const _RestoreModal({required this.onRestore});

  @override
  State<_RestoreModal> createState() => _RestoreModalState();
}

class _RestoreModalState extends State<_RestoreModal> {
  final TextEditingController _jsonController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _jsonController.dispose();
    super.dispose();
  }

  Future<void> _handlePasteAndRestore() async {
    final data = await Clipboard.getData('text/plain');
    if (data?.text != null && data!.text!.trim().isNotEmpty) {
      _jsonController.text = data.text!.trim();
      await _handleRestore(data.text!.trim());
    } else {
      setState(() => _errorMessage = 'Clipboard is empty or contains no text.');
    }
  }

  Future<void> _handleRestore(String jsonText) async {
    if (jsonText.trim().isEmpty) {
      setState(() => _errorMessage = 'Please paste your backup JSON first.');
      return;
    }

    try {
      jsonDecode(jsonText); // Validate JSON
    } catch (e) {
      setState(() => _errorMessage = 'Invalid JSON format. Please check your backup data.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final res = await ApiClient.instance.restoreData(jsonText);

    if (mounted) {
      setState(() => _isLoading = false);
      if (res['success'] == true) {
        widget.onRestore();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppSemanticColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
            content: const Text('Data restored successfully!'),
          ),
        );
      } else {
        setState(() => _errorMessage = res['error'] ?? 'Restore failed');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppSemanticColors.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXxl)),
        boxShadow: AppElevation.level3,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.xs),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppSemanticColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xs, AppSpacing.lg, AppSpacing.md),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Restore from Backup', style: AppTypography.h3.copyWith(color: AppSemanticColors.textPrimary)),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, size: 22),
                    color: AppSemanticColors.textSecondary,
                    constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppSemanticColors.border),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.modalPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Paste your exported JSON backup below, or use the button to auto-fill from clipboard.',
                      style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    TextField(
                      controller: _jsonController,
                      maxLines: 8,
                      minLines: 4,
                      style: AppTypography.mono.copyWith(color: AppSemanticColors.textPrimary),
                      decoration: AppInputStyles.base(
                        label: 'Backup JSON',
                        hint: 'Paste your exported JSON here...',
                        prefixIcon: const Icon(Icons.code, size: 20, color: AppSemanticColors.textSecondary),
                      ).copyWith(
                        alignLabelWithHint: true,
                        contentPadding: const EdgeInsets.all(AppSpacing.md),
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppSemanticColors.danger.withAlpha(20),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                          border: Border.all(color: AppSemanticColors.danger.withAlpha(60)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, size: 18, color: AppSemanticColors.danger),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.danger),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (_successMessage != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppSemanticColors.success.withAlpha(20),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                          border: Border.all(color: AppSemanticColors.success.withAlpha(60)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle_outline, size: 18, color: AppSemanticColors.success),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                _successMessage!,
                                style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.success),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.lg),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _isLoading ? null : _handlePasteAndRestore,
                            style: AppButtonStyles.secondary().copyWith(
                              foregroundColor: WidgetStateProperty.all(AppSemanticColors.cyan),
                              side: WidgetStateProperty.all(const BorderSide(color: AppSemanticColors.cyan, width: 1.5)),
                            ),
                            icon: const Icon(Icons.content_paste_rounded, size: 18),
                            label: const Text('Paste & Restore'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isLoading
                                ? null
                                : () => _handleRestore(_jsonController.text),
                            style: AppButtonStyles.primary(),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text('Restore Data'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}