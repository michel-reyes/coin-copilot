import {
  ActivityIndicator,
  Alert,
  Button,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSession } from '@/app/context/authContext';
import { useState } from 'react';

export default function SignIn() {
  const { signIn } = useSession();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!apiKey || apiKey.trim().length === 0) {
      Alert.alert('Error', 'Please enter a valid Lunch Money API key');
      return;
    }

    try {
      setIsLoading(true);
      // Sign in the user with the Lunch Money API key
      // The auth context handles:
      // 1. Validation
      // 2. Creating hidden email
      // 3. Supabase auth (signup/signin)
      // 4. Saving API key to database
      await signIn(apiKey.trim());
      // Navigation happens automatically via auth state change
    } catch (error) {
      console.error('Sign in error:', error);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to sign in. Please try again.';

      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Coin Copilot
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
        Enter your Lunch Money API key
      </Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          borderRadius: 8,
          width: '100%',
          marginBottom: 20,
          fontSize: 16,
        }}
        placeholder='Lunch Money API key'
        placeholderTextColor='#999'
        onChangeText={setApiKey}
        value={apiKey}
        autoCapitalize='none'
        autoCorrect={false}
        editable={!isLoading}
        secureTextEntry={true}
      />

      {isLoading ? (
        <ActivityIndicator size='large' color='#007AFF' />
      ) : (
        <Button
          title='Sign In'
          onPress={handleSignIn}
          disabled={!apiKey || apiKey.trim().length === 0}
        />
      )}

      <Text
        style={{
          fontSize: 12,
          color: '#666',
          marginTop: 20,
          textAlign: 'center',
        }}
      >
        Your API key is stored securely and encrypted.
      </Text>
    </View>
  );
}
