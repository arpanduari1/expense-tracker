package dev.expensewise.backend.notification.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

/**
 * @author arpan
 * @since 2/10/26
 */
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class NotificationRequest {
    private String title;
    private String body;
    private String token; // For specific user
    private List<String> tokens; // For multiple users
    private String topic; // For public / broadcast
    private Map<String, String> data;
}
