package dev.expensewise.backend.config.notification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * @author arpan
 * @since 2/1/26
 */
@Configuration
public class FirebaseConfig {
    @Value("${app.notification.firebase.service-account-json}")
    private String firebaseServiceAccountJson;

    @PostConstruct
    public void initialize() throws IOException {
        if (firebaseServiceAccountJson == null) {
            throw new IllegalArgumentException("Firebase service account json is not set");
        }
        InputStream serviceAccount =
                new ByteArrayInputStream(firebaseServiceAccountJson.getBytes(StandardCharsets.UTF_8));

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
    }
}
