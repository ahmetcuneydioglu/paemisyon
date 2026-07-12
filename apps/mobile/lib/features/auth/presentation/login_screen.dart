import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .signInWithPassword(_email.text.trim(), _password.text);
      // Başarılıysa router auth-state redirect'i Home'a yönlendirir.
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Giriş yapılamadı, tekrar dene.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Giriş')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Hoş geldin',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xl),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: const InputDecoration(
                  labelText: 'E-posta',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Şifre',
                  border: OutlineInputBorder(),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              PrimaryButton(
                label: 'Giriş yap',
                loading: _loading,
                onPressed: _submit,
              ),
              const SizedBox(height: AppSpacing.md),
              TextButton(
                onPressed: () => context.go('/auth/register'),
                child: const Text('Hesabın yok mu? Kayıt ol'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
