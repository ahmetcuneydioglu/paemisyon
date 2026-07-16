import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';
import 'article_card.dart';
import 'coach_card.dart';
import 'conquest_grid.dart';
import 'empty_state.dart';
import 'explanation_box.dart';
import 'focus_sheet.dart';
import 'goal_progress.dart';
import 'heat_bar.dart';
import 'list_row_stat.dart';
import 'mastery_bar.dart';
import 'option_row.dart';
import 'session_button.dart';
import 'session_result_header.dart';
import 'streak_badge.dart';

/// Component galerisi (Doc 26 §4 kabul kriteri: "önizleme") — geliştirme
/// aracı; üretim navigasyonuna bağlanmaz. Her bileşeni gerçekçi veriyle,
/// uzun-içerik ve boş durum varyantlarıyla gösterir. Widget testleri bu
/// galeriyi iki temada pompalayarak tüm kütüphaneyi duman testinden geçirir.
class ComponentGallery extends StatelessWidget {
  const ComponentGallery({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Component Galerisi')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _section('CoachCard', [
            const CoachCard(
              variant: CoachCardVariant.hero,
              title: 'Serin 3 saat içinde bozuluyor',
              body: '5 soru yeter — 3 dakika.',
              leading: '⚠️',
              ctaLabel: 'Mini seans (5 soru)',
              onCta: _noop,
            ),
            const SizedBox(height: AppSpacing.sm),
            const CoachCard(
              leading: '🔁',
              title: "Salı'nın 4 yanlışından tekrar hazır",
              body: '5 dakika sürer',
              ctaLabel: 'Tekrarı çöz',
              onCta: _noop,
            ),
            const SizedBox(height: AppSpacing.sm),
            const CoachCard(
              leading: '📉',
              title:
                  "2911 Toplantı ve Gösteri Yürüyüşleri Kanunu'nda üç haftadır "
                  'yüzde kırkın altındasın — uzun başlık taşma denemesi',
              onTap: _noop,
            ),
          ]),
          _section('SessionButton', [
            const SessionButton(
              label: 'Bugün Çalış',
              onPressed: _noop,
              focusLabel: 'Odak: Koç seçiyor',
              onFocusTap: _noop,
            ),
          ]),
          _section('GoalProgress', [
            const GoalProgress(answered: 8, goal: 20),
            const SizedBox(height: AppSpacing.sm),
            const GoalProgress(answered: 20, goal: 20),
          ]),
          _section('StreakBadge', [
            const Row(children: [
              StreakBadge(days: 47),
              SizedBox(width: AppSpacing.sm),
              StreakBadge(days: 47, atRisk: true),
            ]),
          ]),
          _section('OptionRow — 5 durum', [
            for (final (s, t) in [
              (OptionRowState.idle, 'Kademeli olarak artan şekilde uygulanır'),
              (OptionRowState.selected, 'Direnişi kırmak amacıyla kullanılır'),
              (OptionRowState.correct, 'Amirin emri olmadan hiçbir şekilde…'),
              (OptionRowState.wrongPick, 'Silah kullanma en son çaredir'),
              (OptionRowState.dimmed, 'Orantılılık ilkesi gözetilir'),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: OptionRow(
                    label: 'A', text: t, state: s, onTap: _noop),
              ),
          ]),
          _section('ExplanationBox + SourceTag', [
            const ExplanationBox(
              explanation:
                  'Zor kullanma amir emrine bağlı değildir; PVSK m.16 '
                  'şartları oluştuğunda polis kendi takdiriyle kademeli '
                  'olarak zor kullanır.',
              source: '2019 PAEM',
              articleLabel: 'İlgili madde: PVSK m.16',
              onArticleTap: _noop,
            ),
          ]),
          _section('SessionResultHeader', [
            const SessionResultHeader(
                score: '12/15', subtitle: 'CMK odaklı seans · 14 dk'),
          ]),
          _section('MasteryBar — eşikler', [
            const MasteryBar(value: 0.31),
            const SizedBox(height: AppSpacing.sm),
            const MasteryBar(value: 0.48),
            const SizedBox(height: AppSpacing.sm),
            const MasteryBar(value: 0.71),
          ]),
          _section('ListRowStat', [
            const ListRowStat(
              title: 'Koruma tedbirleri',
              subtitle: '12 konu · 29 soru',
              trailing: SizedBox(width: 110, child: MasteryBar(value: 0.31)),
              onTap: _noop,
            ),
            const ListRowStat(
              title: 'İfade alma',
              trailing: SizedBox(width: 110, child: MasteryBar(value: 0.71)),
              onTap: _noop,
            ),
          ]),
          _section('HeatBar', [
            const HeatBar(label: 'm.16', count: 23, ratio: 1, onTap: _noop),
            const HeatBar(label: 'm.4/A', count: 16, ratio: 0.7, onTap: _noop),
            const HeatBar(label: 'm.5', count: 10, ratio: 0.43, onTap: _noop),
          ]),
          _section('ConquestGrid — gösterim + etkileşimli', [
            ConquestGrid(total: 28, done: {for (var i = 1; i <= 11; i++) i}),
            const SizedBox(height: AppSpacing.md),
            ConquestGrid(
              total: 12,
              done: const {1, 2, 5},
              onCellTap: (_) {},
            ),
          ]),
          _section('ArticleCard — iki yüz + kilitli', [
            const ArticleCard(
              title: 'Madde 16 — Zor ve silah kullanma',
              officialText:
                  'Polis, görevini yaparken direnişle karşılaşması halinde, '
                  'bu direnişi kırmak amacıyla ve kıracak ölçüde zor '
                  'kullanmaya yetkilidir.',
              simplifiedText:
                  'Üç kademe: bedenî kuvvet → maddî güç → silah. Sıra '
                  'atlanmaz, orantı şart, amir emri gerekmez.',
              scenarioText: 'Şüpheli üst aramasına direniyor…',
            ),
            const SizedBox(height: AppSpacing.sm),
            const ArticleCard(
              title: 'Madde 17 — Durdurma (kilitli AI yüzü)',
              officialText: 'Polis, kişileri ve araçları durdurabilir…',
              lockedCtaLabel: 'Ücretsiz kayıt ol',
              onLockedCta: _noop,
            ),
          ]),
          _section('EmptyStateView', [
            const SizedBox(
              height: 220,
              child: EmptyStateView(
                icon: Icons.quiz_outlined,
                message: 'Henüz yanlışın yok — çözdükçe burada birikecek.',
                actionLabel: 'Seans başlat',
                onAction: _noop,
              ),
            ),
          ]),
          _section('FocusSheet', [
            Builder(
              builder: (context) => OutlinedButton(
                onPressed: () => showFocusSheet(
                  context,
                  selectedId: 'coach',
                  options: const [
                    FocusOption(
                        id: 'coach', label: 'Koç seçsin', subtitle: 'önerilen'),
                    FocusOption(
                        id: 'course',
                        label: 'Ders seç',
                        subtitle: 'Anayasa, CMK…',
                        drillsDown: true),
                    FocusOption(id: 'wrongs', label: 'Sadece yanlışlarım'),
                  ],
                ),
                child: const Text('Odak seçiciyi aç'),
              ),
            ),
          ]),
          const SizedBox(height: AppSpacing.xxxl),
          Center(
            child: Text(
              'Doc 26 §4 — ilk dalga 15 bileşen',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
            ),
          ),
        ],
      ),
    );
  }

  static void _noop() {}

  Widget _section(String title, List<Widget> children) {
    return Builder(
      builder: (context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title.toUpperCase(),
              style: AppTypography.caption
                  .copyWith(color: context.tokens.inkSoft),
            ),
            const SizedBox(height: AppSpacing.sm),
            ...children,
          ],
        ),
      ),
    );
  }
}
