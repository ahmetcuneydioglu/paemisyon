import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/explanation_box.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/option_row.dart';
import '../../../shared/widgets/question_media.dart';
import '../data/cikmis_sinav_repository.dart';
import '../domain/cikmis_sinav_models.dart';

/// Çıkmış sınav — ÇALIŞMA MODU (Doc 36 §4).
///
/// Sunucuya oturum açılmaz: doğru cevap ve açıklama zaten yükte geliyor, bu
/// yüzden dokunuş anında değerlendirilir. Süre tutulmaz, net hesaplanmaz,
/// hiçbir yere yazılmaz — ölçmek isteyen "Sınav gibi çöz"ü kullanır. İki
/// ölçümü karıştırmak, adayın hangisinin gerçek olduğunu bilememesi demekti.
///
/// Tur oynatıcının dilini aynen kullanır (dokunuş = cevap, anında renk + ikon,
/// açıklama aynı ekranda) — aday iki ekran arasında yeniden öğrenmez.
class CikmisCalismaScreen extends ConsumerStatefulWidget {
  final String slug;
  const CikmisCalismaScreen({super.key, required this.slug});

  @override
  ConsumerState<CikmisCalismaScreen> createState() =>
      _CikmisCalismaScreenState();
}

class _CikmisCalismaScreenState extends ConsumerState<CikmisCalismaScreen> {
  final _pager = PageController();

  /// sıra → seçilen şık harfi. Ekran ömrü boyunca yaşar (kalıcı değil):
  /// çalışma modu bir ölçüm değil, bu yüzden geri dönüldüğünde sıfırlanması
  /// doğru davranış.
  final Map<int, String> _secim = {};
  int _index = 0;

  @override
  void dispose() {
    _pager.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(cikmisSinavDetayProvider(widget.slug));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Çalışma modu'),
        actions: [
          data.maybeWhen(
            data: (d) => d.sorular.isEmpty
                ? const SizedBox.shrink()
                : IconButton(
                    tooltip: 'Soruya git',
                    icon: const Icon(Icons.grid_view_rounded),
                    onPressed: () => _soruSec(d.sorular),
                  ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: data.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          children: const [
            LoadingSkeleton(height: 72),
            SizedBox(height: AppSpacing.xl),
            LoadingSkeleton(height: 56),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 56),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 56),
          ],
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Sınav yüklenemedi.',
          onRetry: () =>
              ref.invalidate(cikmisSinavDetayProvider(widget.slug)),
        ),
        data: (d) {
          final sorular = d.sorular;
          if (sorular.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: Text('Bu dönemde gösterilecek soru yok.'),
              ),
            );
          }
          return Column(
            children: [
              _IlerlemeSeridi(
                sorular: sorular,
                secim: _secim,
                index: _index,
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pager,
                  itemCount: sorular.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, i) => _SoruSayfasi(
                    soru: sorular[i],
                    secilen: _secim[sorular[i].sira],
                    sonuncu: i == sorular.length - 1,
                    onSec: (harf) =>
                        setState(() => _secim[sorular[i].sira] = harf),
                    onSonraki: i == sorular.length - 1 ? null : _sonraki,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _sonraki() => _pager.nextPage(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
      );

  /// 100 soruluk bir sette kaydırarak dolaşmak işkence: numara ızgarası hem
  /// atlama kapısı hem de ilerleme haritası (yeşil doğru, kırmızı yanlış).
  Future<void> _soruSec(List<CikmisSoru> sorular) async {
    final tokens = context.tokens;
    final secilen = await showModalBottomSheet<int>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
          // Genişlik açıkça veriliyor: modal sheet gevşek kısıt geçiriyor ve
          // `mainAxisSize.min` bir Column içerik kadar daralıyor — az soruda
          // sayfa ortada dar bir pil gibi duruyordu.
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(width: double.infinity),
              Text('Soruya git',
                  textAlign: TextAlign.start,
                  style: AppTypography.heading.copyWith(color: tokens.ink)),
              const SizedBox(height: AppSpacing.md),
              Flexible(
                child: SingleChildScrollView(
                  child: Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: [
                      for (var i = 0; i < sorular.length; i++)
                        _IzgaraDugmesi(
                          soru: sorular[i],
                          secilen: _secim[sorular[i].sira],
                          aktif: i == _index,
                          onTap: () => Navigator.pop(ctx, i),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (secilen == null || !mounted) return;
    _pager.jumpToPage(secilen);
    setState(() => _index = secilen);
  }
}

// ── İlerleme şeridi ──

class _IlerlemeSeridi extends StatelessWidget {
  final List<CikmisSoru> sorular;
  final Map<int, String> secim;
  final int index;

  const _IlerlemeSeridi({
    required this.sorular,
    required this.secim,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    // İptal edilen soru puanlanmaz; doğru sayısına da katılmaz.
    final gecerli = sorular.where((s) => !s.iptal);
    final cevaplanan =
        gecerli.where((s) => secim[s.sira] != null).length;
    final dogru = gecerli
        .where((s) => secim[s.sira] != null && secim[s.sira] == s.dogruHarf)
        .length;

    return Container(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.sm),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: tokens.line)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text('Soru ${index + 1} / ${sorular.length}',
                  style: AppTypography.label.copyWith(color: tokens.ink)),
              const Spacer(),
              Semantics(
                liveRegion: true,
                child: Text(
                  cevaplanan == 0
                      ? 'Henüz cevaplamadın'
                      : '$cevaplanan cevap · $dogru doğru',
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            child: LinearProgressIndicator(
              value: (index + 1) / sorular.length,
              minHeight: 4,
              backgroundColor: tokens.surfaceAlt,
              valueColor: AlwaysStoppedAnimation<Color>(tokens.brand),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tek soru ──

class _SoruSayfasi extends StatelessWidget {
  final CikmisSoru soru;
  final String? secilen;
  final bool sonuncu;
  final ValueChanged<String> onSec;
  final VoidCallback? onSonraki;

  const _SoruSayfasi({
    required this.soru,
    required this.secilen,
    required this.sonuncu,
    required this.onSec,
    required this.onSonraki,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final cevaplandi = secilen != null;
    final dayanak = soru.dayanak
        .map((d) => d.baslik)
        .where((b) => b.trim().isNotEmpty)
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text('${soru.sira}. soru',
                  style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(soru.ders,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft)),
              ),
              if (soru.iptal) const _IptalRozeti(),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(soru.kok, style: AppTypography.heading),
          if (soru.gorselUrl != null) ...[
            const SizedBox(height: AppSpacing.md),
            QuestionMedia(url: soru.gorselUrl!),
          ],
          const SizedBox(height: AppSpacing.xl),
          for (final s in soru.siklar)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: OptionRow(
                label: s.harf,
                text: s.metin,
                state: _durum(s),
                // Dokunuş = cevap (Doc 26 §3.4). Cevaplandıktan sonra kilitli:
                // şıkları tek tek deneyip doğruyu bulmak öğrenme değil.
                onTap: cevaplandi ? null : () => onSec(s.harf),
              ),
            ),
          if (cevaplandi &&
              ((soru.aciklama != null && soru.aciklama!.trim().isNotEmpty) ||
                  dayanak.isNotEmpty)) ...[
            const SizedBox(height: AppSpacing.lg),
            ExplanationBox(
              explanation: [
                if (soru.aciklama != null && soru.aciklama!.trim().isNotEmpty)
                  soru.aciklama!,
                if (dayanak.isNotEmpty) 'Dayanak: ${dayanak.join(' · ')}',
              ].join('\n\n'),
            ),
          ],
          const SizedBox(height: AppSpacing.xl),
          if (cevaplandi && !sonuncu)
            FilledButton(
              onPressed: onSonraki,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(AppSpacing.minTouchTarget),
              ),
              child: const Text('Sonraki soru'),
            )
          else if (cevaplandi && sonuncu)
            Text(
              'Son soruydu. Aynı seti süre tutarak çözmek istersen sınav modunu seç.',
              textAlign: TextAlign.center,
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
            ),
        ],
      ),
    );
  }

  OptionRowState _durum(CikmisSik s) {
    if (secilen == null) return OptionRowState.idle;
    if (s.dogru) return OptionRowState.correct;
    if (s.harf == secilen) return OptionRowState.wrongPick;
    return OptionRowState.dimmed;
  }
}

class _IptalRozeti extends StatelessWidget {
  const _IptalRozeti();

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xs / 2),
      decoration: BoxDecoration(
        color: tokens.warning.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Text('Sınavda iptal edildi',
          style: AppTypography.caption
              .copyWith(color: tokens.warning, fontWeight: FontWeight.w700)),
    );
  }
}

// ── Izgara düğmesi ──

class _IzgaraDugmesi extends StatelessWidget {
  final CikmisSoru soru;
  final String? secilen;
  final bool aktif;
  final VoidCallback onTap;

  const _IzgaraDugmesi({
    required this.soru,
    required this.secilen,
    required this.aktif,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final Color bg, fg;
    if (secilen == null) {
      bg = tokens.surfaceAlt;
      fg = tokens.inkSoft;
    } else if (secilen == soru.dogruHarf) {
      bg = tokens.success.withValues(alpha: 0.16);
      fg = tokens.success;
    } else {
      bg = tokens.danger.withValues(alpha: 0.16);
      fg = tokens.danger;
    }

    return Semantics(
      button: true,
      selected: aktif,
      label: '${soru.sira}. soru',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: Container(
          width: AppSpacing.minTouchTarget,
          height: AppSpacing.minTouchTarget,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            border: aktif ? Border.all(color: tokens.brand, width: 2) : null,
          ),
          child: Text('${soru.sira}',
              style: AppTypography.label.copyWith(color: fg)),
        ),
      ),
    );
  }
}
