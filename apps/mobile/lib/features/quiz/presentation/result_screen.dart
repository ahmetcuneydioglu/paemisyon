import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/list_row_stat.dart';
import '../../../shared/widgets/mastery_bar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/session_result_header.dart';
import '../domain/quiz_models.dart';

/// Seans Sonucu (Doc 25 §2, wireframe 04): skor değil sonraki adım satar.
/// Eve dönüş çapası: birincil buton her zaman Bugün'e döner.
/// [patrol] = İlk Devriye (Doc 24 Gün 0, Doc 28 P2-14): aynı ekran TEŞHİS
/// çerçevesine döner — "not değil başlangıç noktası"; karne öne çıkar.
class ResultScreen extends StatelessWidget {
  final QuizResult result;
  final bool patrol;

  /// Aynı kapsamda YENİ TUR başlatmak için gereken argümanlar (/quiz extra'sı).
  /// Null ise buton gösterilmez: deneme, tek soruluk push ve İlk Devriye
  /// tekrarlanabilir değildir.
  final Map<String, dynamic>? restartArgs;

  const ResultScreen({
    super.key,
    required this.result,
    this.patrol = false,
    this.restartArgs,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final mins = result.durationSeconds ~/ 60;
    final secs = result.durationSeconds % 60;
    final answered = result.correctCount + result.wrongCount;

    return Scaffold(
      appBar: AppBar(
          title: Text(patrol ? 'İlk Devriye' : 'Sonuç'),
          automaticallyImplyLeading: false),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.lg),
              SessionResultHeader(
                score: '${result.correctCount}/${result.totalQuestions}',
                subtitle: patrol
                    ? 'Seviye tespiti tamam — bu bir not değil, başlangıç noktan.'
                    : '${mins > 0 ? '$mins dk ' : ''}$secs sn · %${result.score.toStringAsFixed(0)} başarı',
              ),
              const SizedBox(height: AppSpacing.xl),

              // ── Kırılım: doğru / yanlış / boş ──
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                decoration: BoxDecoration(
                  color: tokens.surface,
                  border: Border.all(color: tokens.line),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _Stat(
                        label: 'Doğru',
                        value: result.correctCount,
                        color: tokens.success),
                    _Stat(
                        label: 'Yanlış',
                        value: result.wrongCount,
                        color: tokens.danger),
                    _Stat(
                        label: 'Boş',
                        value: result.blankCount,
                        color: tokens.inkSoft),
                  ],
                ),
              ),

              // ── Koç yorumu (v1 kural tabanlı — Doc 26 §1: rakam konuşur) ──
              if (answered > 0) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: tokens.surfaceAlt,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Text(
                    _coachLine(),
                    style: AppTypography.body.copyWith(color: tokens.ink),
                  ),
                ),
              ],

              // ── Rozet kutlaması (Doc 19) ──
              if (result.earnedBadges.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                for (final b in result.earnedBadges)
                  Container(
                    margin: const EdgeInsets.only(bottom: AppSpacing.xs),
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg, vertical: AppSpacing.sm + 2),
                    decoration: BoxDecoration(
                      color: tokens.accentAtlas.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.military_tech_rounded,
                            color: tokens.accentAtlas),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Yeni rozet: ${b.name}',
                                  style: AppTypography.label
                                      .copyWith(color: tokens.accentAtlas)),
                              if (b.description.isNotEmpty)
                                Text(b.description,
                                    style: AppTypography.caption
                                        .copyWith(color: tokens.accentAtlas)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],

              // ── Konu karnesi (ders denemesi / İlk Devriye teşhisi) ──
              if (result.topicBreakdown != null &&
                  result.topicBreakdown!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                // Flexible + shrinkWrap: tek konulu karnede kart içeriğine
                // sarılır. Expanded'ken kart kalan tüm boşluğu kaplıyor ve
                // ekranın yarısı bomboş görünüyordu.
                Flexible(
                  child: Container(
                    decoration: BoxDecoration(
                      color: tokens.surface,
                      border: Border.all(color: tokens.line),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: ListView(
                      shrinkWrap: true,
                      padding: const EdgeInsets.all(AppSpacing.md),
                      children: [
                        Text(patrol ? 'TEŞHİS KARNESİ' : 'KONU KARNESİ',
                            style: AppTypography.caption
                                .copyWith(color: tokens.inkSoft)),
                        const SizedBox(height: AppSpacing.xs),
                        ...result.topicBreakdown!.map(
                          (t) => ListRowStat(
                            title: t.topicName,
                            trailing: SizedBox(
                              width: 96,
                              child: MasteryBar(
                                value: t.total > 0 ? t.correct / t.total : 0,
                                showLabel: false,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
              ] else
                const Spacer(),

              // ── Devam etme yolu + eve dönüş çapası ──
              // Akış burada bitmemeli: aynı kapsamda yeni tur tek dokunuş
              // uzakta olsun (eskiden en baştan konu seçmek gerekiyordu).
              if (restartArgs != null) ...[
                PrimaryButton(
                  label: '${restartArgs!['count'] ?? 10} soru daha çöz',
                  onPressed: () =>
                      context.pushReplacement('/quiz', extra: restartArgs),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              if (result.wrongCount > 0) ...[
                OutlinedButton(
                  onPressed: () {
                    context.go('/');
                    context.push('/review');
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: tokens.ink,
                    side: BorderSide(color: tokens.ink, width: 1.5),
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: Text('Yanlışları incele (${result.wrongCount})'),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              // Eve dönüş çapası (Doc 25 §2) korunur: yeni tur varken ikincil,
              // yokken tek ve birincil eylem.
              if (restartArgs == null)
                PrimaryButton(
                    label: patrol ? 'Planımı gör' : "Bugün'e dön",
                    onPressed: () => context.go('/'))
              else
                TextButton(
                  onPressed: () => context.go('/'),
                  style: TextButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                  ),
                  child: Text("Bugün'e dön",
                      style: AppTypography.label.copyWith(color: tokens.ink)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Kural tabanlı tek cümle — sıfat değil rakam (Doc 26 §1.1). V2'de AI.
  String _coachLine() {
    if (patrol) return _patrolLine();
    final wrong = result.wrongCount;
    final pct = result.score.round();
    if (wrong == 0 && result.correctCount > 0) {
      return 'Hatasız seans — %$pct. Bu konuda tekrarı hak ettin: yarın kısa bir pekiştirme yeter.';
    }
    if (wrong > 0) {
      return '$wrong yanlışını yarınki tekrar kuyruğuna ekledim — kaybolmazlar. Bugünkü isabet: %$pct.';
    }
    return 'Seans tamamlandı. Yarın kaldığın yerden devam.';
  }

  /// Teşhis dili (Doc 24 Gün 0): en zayıf konu = ilk hedef; suçlama yok.
  String _patrolLine() {
    final breakdown = result.topicBreakdown;
    if (breakdown != null && breakdown.isNotEmpty) {
      TopicScore? weakest;
      for (final t in breakdown) {
        if (t.total == 0) continue;
        final ratio = t.correct / t.total;
        final wRatio =
            weakest == null ? 2.0 : weakest.correct / weakest.total;
        if (ratio < wRatio) weakest = t;
      }
      if (weakest != null && weakest.correct < weakest.total) {
        return 'Devriye raporu hazır: ilk hedefimiz ${weakest.topicName}. '
            'Yarından itibaren planını buna göre kuruyorum.';
      }
    }
    return 'Devriye temiz geçti — seviyeni gördüm, planını buna göre kuruyorum.';
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _Stat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      children: [
        Text('$value', style: AppTypography.display.copyWith(color: color, fontSize: 26)),
        Text(label, style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
      ],
    );
  }
}
