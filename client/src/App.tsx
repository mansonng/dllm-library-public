import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { auth } from './firebase';
import { Button, Box, Typography, List, ListItem } from '@mui/material';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();

const ITEMS_QUERY = gql`
  query ItemsByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!) {
    itemsByLocation(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
      id
      name
      condition
      status
      category
    }
  }
`;

interface Item {
  id: string;
  name: string;
  condition: string;
  status: string;
  category: string[];
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    /*
    const provider = new EmailAuthProvider();
    await signInWithPopup(auth, provider);
    */
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Account created successfully');
      } catch (error) {
        console.error('Error creating account:', error);
      }
    }   
  };

  const signUp = async () => {
    /*
    const provider = new EmailAuthProvider();
    await signInWithPopup(auth, provider);
    */
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    if (email && password) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Account created successfully');
      } catch (error) {
        console.error('Error creating account:', error);
      }
    }   
  };

  const signOut = async () => {
    await auth.signOut();
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => console.error(err)
    );
  };

  const { data, loading, error } = useQuery<{ itemsByLocation: Item[] }>(ITEMS_QUERY, {
    variables: location ? { ...location, radiusKm: 10 } : undefined,
    skip: !location,
  });

  return (
    <Box p={4}>
      <Typography variant="h4">無大台香港典藏館</Typography>
      {user ? (
        <>
          <Typography>Welcome, {user.email}</Typography>
          <Button onClick={signOut}>Sign Out</Button>
          <Button onClick={getLocation}>Use My Location</Button>
          {location && (
            <Box mt={2}>
              <Typography variant="h6">Items within 10km</Typography>
              {loading && <Typography>Loading...</Typography>}
              {error && <Typography>Error: {error.message}</Typography>}
              {data && (
                <List>
                  {data.itemsByLocation.map((item) => (
                    <ListItem key={item.id}>
                      {item.name} ({item.condition}, {item.status})
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </>
      ) : (
        <>
        <Button onClick={signUp}>Sign up with Email</Button>
        <Button onClick={signIn}>Sign In</Button>
        </>
      )}
    </Box>
  );
};

export default App;