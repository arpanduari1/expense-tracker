package dev.expensewise.backend.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * @author arpan
 * @since 2/10/26
 */
@Service
@RequiredArgsConstructor
public class UserTokenService {
    private UserTokenRepository userTokenRepository;

    public void saveOrUpdateToken(Long userId, String fcmToken, DeviceType deviceType) {
        Optional<UserToken> existingToken = userTokenRepository.findByFcmToken(fcmToken);

        UserToken token;
        if (existingToken.isPresent()) {
            token = existingToken.get();
            token.setUserId(userId);
        } else {
            token = new UserToken();
            token.setUserId(userId);
            token.setFcmToken(fcmToken);
        }
        token.setDeviceType(deviceType);
        userTokenRepository.save(token);
    }

    public List<String> getTokensByUserId(Long userId) {
        return userTokenRepository.findByUserId(userId).stream()
                .map(UserToken::getFcmToken)
                .toList();
    }

    public List<String> getTokensByUserIds(List<Long> userIds) {
        return userIds.stream().flatMap(id -> getTokensByUserId(id).stream()).toList();
    }

    public void removeToken(String fcmToken) {
        userTokenRepository.findByFcmToken(fcmToken).ifPresent(userTokenRepository::delete);
    }

    public void removeAllTokensForUsers(Long userId){
        userTokenRepository.deleteAll(userTokenRepository
                .findByUserId(userId));
    }
}
