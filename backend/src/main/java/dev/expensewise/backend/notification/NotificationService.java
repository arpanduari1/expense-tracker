package dev.expensewise.backend.notification;

import com.google.firebase.messaging.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author arpan
 * @since 2/1/26
 */
@Service
public class NotificationService {
    private final UserTokenService userTokenService;

    public NotificationService(UserTokenService userTokenService) {
        this.userTokenService = userTokenService;
    }

    public void sendNotificationToUser(Long userId, String title, String body, Map<String, String> data) {
        List<String> deviceTokens = userTokenService.getTokensByUserId(userId);
        if (deviceTokens.isEmpty()) {
            return;
        }
        sendNotificationToMultipleDevices(deviceTokens, title, body, data);
    }

    public void sendNotificationToUsers(List<Long> userIds, String title, String body, Map<String, String> data) {
        List<String> deviceTokens = userTokenService.getTokensByUserIds(userIds);
        if (deviceTokens.isEmpty()) {
            return;
        }
        sendNotificationToMultipleDevices(deviceTokens, title, body, data);
    }

    public void sendNotificationToTopic(String topic, String title, String body, Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(buildNotification(title, body))
                    .putAllData(data != null ? data : new HashMap<>())
                    .setAndroidConfig(buildAndroidConfig(AndroidConfig.Priority.HIGH))
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (FirebaseMessagingException ex) {
            // TODO ADD logging and error handling
        }
    }

    public void sendNotificationToMultipleDevices(
            List<String> deviceTokens, String title, String body, Map<String, String> data) {
        try {
            MulticastMessage message = MulticastMessage.builder()
                    .addAllTokens(deviceTokens)
                    .setNotification(buildNotification(title, body))
                    .setAndroidConfig(
                            buildAndroidConfigWithNotification(AndroidConfig.Priority.HIGH, "default", "#000000"))
                    .putAllData(data != null ? data : new HashMap<>())
                    .build();
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); ++i) {
                    if (!responses.get(i).isSuccessful()) {
                        String failedToken = deviceTokens.get(i);
                        String errorCode =
                                responses.get(i).getException().getErrorCode().name();
                        if ("INVALID_ARGUMENT".equals(errorCode)
                                || "NOT_FOUND".equals(errorCode)
                                || "UNREGISTERED".equals(errorCode)) {
                            userTokenService.removeToken(failedToken);
                        }
                    }
                }
            }
        } catch (FirebaseMessagingException ex) {

        }
    }

    private Notification buildNotification(String title, String body) {
        return Notification.builder().setTitle(title).setBody(body).build();
    }

    private AndroidConfig buildAndroidConfigWithNotification(
            AndroidConfig.Priority priority, String sound, String color) {
        return AndroidConfig.builder()
                .setPriority(priority)
                .setNotification(buildAndroidNotification(sound, color))
                .build();
    }

    private AndroidConfig buildAndroidConfig(AndroidConfig.Priority priority) {
        return AndroidConfig.builder().setPriority(priority).build();
    }

    private AndroidNotification buildAndroidNotification(String sound, String color) {
        return AndroidNotification.builder().setSound(sound).setColor(color).build();
    }
}
