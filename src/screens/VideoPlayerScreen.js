import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { api } from '../api/client';
import { resolveMediaUrl } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

function isBunnyEmbedUrl(url) {
  return typeof url === 'string' && url.includes('iframe.mediadelivery.net/embed/');
}

// ویدیوی محلی (ذخیره‌شده روی دیسک بک‌اند): پخش با expo-video + ذخیره‌ی خودکار پیشرفت
function LocalVideoPlayer({ video, videoId, token }) {
  const startAt = video.progress?.watched_seconds || 0;
  const lastSavedRef = useRef(Math.floor(startAt));

  const player = useVideoPlayer(resolveMediaUrl(video.url), (p) => {
    if (startAt > 0) p.currentTime = startAt;
    p.play();
  });

  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: startAt });
  useEvent(player, 'playToEnd', {});

  useEffect(() => {
    const rounded = Math.floor(currentTime || 0);
    if (rounded > 0 && rounded % 10 === 0 && rounded !== lastSavedRef.current) {
      lastSavedRef.current = rounded;
      const completed = player.duration > 0 && rounded >= player.duration - 2;
      api.saveProgress(videoId, { watched_seconds: rounded, completed }, token).catch(() => {});
    }
  }, [currentTime, player, videoId, token]);

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      api
        .saveProgress(videoId, { watched_seconds: Math.floor(player.duration || 0), completed: true }, token)
        .catch(() => {});
    });
    return () => subscription.remove();
  }, [player, videoId, token]);

  return <VideoView style={styles.video} player={player} allowsFullscreen nativeControls />;
}

// ویدیوی Bunny Stream: پخش با WebView. ردیابی خودکار پیشرفت داخل WebView قابل‌اطمینان
// نیست، بنابراین یک دکمه‌ی «علامت‌گذاری به عنوان تماشا شده» جایگزین آن است.
function BunnyVideoPlayer({ video, videoId, token, onMarkedComplete }) {
  return (
    <>
      <WebView source={{ uri: video.url }} style={styles.video} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} />
      {!video.progress?.completed && (
        <Button
          title="علامت‌گذاری به عنوان تماشا شده"
          onPress={async () => {
            await api.saveProgress(videoId, { watched_seconds: video.duration_seconds || 0, completed: true }, token).catch(() => {});
            onMarkedComplete();
          }}
          variant="secondary"
          style={styles.markButton}
        />
      )}
    </>
  );
}

export default function VideoPlayerScreen({ route }) {
  const { videoId } = route.params;
  const { token } = useAuth();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getVideo(videoId, token).then(setVideo).catch((e) => setError(e.message));
  }, [videoId, token]);

  if (error) return <ErrorView message={error} />;
  if (!video) return <LoadingView />;

  const isBunny = isBunnyEmbedUrl(video.url);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{video.title}</Text>
      <View style={styles.playerWrap}>
        {isBunny ? (
          <BunnyVideoPlayer
            video={video}
            videoId={videoId}
            token={token}
            onMarkedComplete={() => setVideo({ ...video, progress: { ...video.progress, completed: true } })}
          />
        ) : (
          <LocalVideoPlayer video={video} videoId={videoId} token={token} />
        )}
      </View>
      <Text style={video.progress?.completed ? styles.completedText : styles.hintText}>
        {video.progress?.completed ? '✓ این ویدیو را تماشا کرده‌اید' : 'پیشرفت شما به‌طور خودکار ذخیره می‌شود.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: 16 },
  title: { fontSize: 18, fontWeight: '800', color: colors.heading, marginBottom: 12 },
  playerWrap: { aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' },
  video: { flex: 1 },
  markButton: { marginTop: 12 },
  hintText: { fontSize: 12, color: colors.ink, opacity: 0.6, marginTop: 12 },
  completedText: { fontSize: 13, color: colors.sage, fontWeight: '700', marginTop: 12 },
});
