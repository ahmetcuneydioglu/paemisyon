# Flutter motoru + eklentiler yansıma kullanır; kırpılmamalı.
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# Firebase Cloud Messaging (push) ve Google Play Billing.
-keep class com.google.firebase.** { *; }
-keep class com.android.billingclient.** { *; }
-dontwarn com.google.firebase.**

# flutter_local_notifications: bildirim planlayıcı sınıfları yansımayla çağrılır.
-keep class com.dexterous.** { *; }
