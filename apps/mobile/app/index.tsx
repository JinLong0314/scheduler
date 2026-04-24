import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/lib/auth-store';

export default function Index() {
  const { token, hydrated } = useAuthStore();

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAF3E8',
        }}
      >
        <ActivityIndicator color="#8B6F47" size="large" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/login'} />;
}
