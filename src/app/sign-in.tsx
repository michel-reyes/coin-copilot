import { router } from 'expo-router';
import { Button, Text, TextInput, View } from 'react-native';

import { useSession } from '@/app/context/authContext';
import { useState } from 'react';

export default function SignIn() {
  const { signIn } = useSession();
      
const [text, setText] = useState('');


  const handleSignIn = () => {
    if (!text) {
      alert('Please enter a valid Lunch money API key');
      return;
    }

    // signin the user with the lunch money api key
    signIn(text);
    // redirect to the private app section
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        onPress={handleSignIn}
        >
          Sign In
      </Text>


      <TextInput
      style={{ borderWidth: 1, borderColor: 'black', padding: 10, borderRadius: 5 }}
        placeholder='Lunch money Api key'
        onChangeText={setText}
        value={text}
      />
      
      <Button title='Save Lunch money Api key' onPress={handleSignIn} />

    </View>
  );
}
