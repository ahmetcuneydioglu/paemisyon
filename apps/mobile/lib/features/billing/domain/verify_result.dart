/// `/billing/verify` sonucu — premium kararı SUNUCUNUNDUR (Doc 15).
/// İstemci "satın aldım" diyemez; bu nesne sunucunun verdiği cevaptır.
class VerifyResult {
  final bool isPremium;
  final DateTime? validUntil;
  final String? plan;

  const VerifyResult({required this.isPremium, this.validUntil, this.plan});

  factory VerifyResult.fromJson(Map<String, dynamic> j) => VerifyResult(
        isPremium: j['isPremium'] == true,
        validUntil: j['validUntil'] != null
            ? DateTime.tryParse(j['validUntil'] as String)
            : null,
        plan: j['plan'] as String?,
      );
}
