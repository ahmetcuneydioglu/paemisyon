-- GÜVENLİK: bir mağaza işlemi yalnız BİR abonelik satırı üretir.
-- Aynı originalTransactionId ile eşzamanlı iki doğrulama iki satır yaratıp
-- aynı ödemeyle iki hesaba premium verebiliyordu (BLOCKER-3).
CREATE UNIQUE INDEX "subscriptions_original_transaction_id_key" ON "subscriptions"("original_transaction_id");
