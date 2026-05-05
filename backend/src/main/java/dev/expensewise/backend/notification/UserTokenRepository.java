package dev.expensewise.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * @author arpan
 * @since 2/10/26
 */
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    List<UserToken> findByUserId(Long userId);

    Optional<UserToken> findByFcmToken(String fcmToken);
}
