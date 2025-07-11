import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import {
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Create a custom icon using Leaflet's default marker
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/535/535239.png',
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 23]
});

export const GET_GEO_DETAILS = gql`
  query GeocodeAddress($address: String!) {
    geocodeAddress(address: $address) {
      latitude
      longitude
      geohash
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($address: String, $nickname: String) {
    updateUser(address: $address, nickname: $nickname) {
      id
      address
      nickname
      createdAt
      location {
        latitude
        longitude
        geohash
      }
      isVerified
      isActive
  }
}`;


interface UserProps {
  onUserCreated?: (data: UpdateUserMutation) => void;
  open?: boolean;
  onClose?: () => void;
}


const UpdateUser: React.FC<UserProps> = ({ onUserCreated,
  open = true,
  onClose
}) => {
  const [internalOpen, setInternalOpen] = useState(open);

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };
  const [address, setAddress] = useState("");
  const [nickname, setNickname] = useState("");
  // const [showUpdateUser, setShowUpdateUser] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const [UpdateUser, { data, loading, error: mutationError }] = useMutation<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >(UPDATE_USER_MUTATION, {
    onCompleted: (data) => {
      if (onUserCreated) onUserCreated(data);
      setInternalOpen(false);
      setAddress("");
      setNickname("");
      setResolvedLocation(null);
    },
  });

  const [geocodeAddress, { loading: geocodeLoading }] = useLazyQuery(GET_GEO_DETAILS, {
    onCompleted: (data) => {
      if (data && data.geocodeAddress) {
        setResolvedLocation({
          latitude: data.geocodeAddress.latitude,
          longitude: data.geocodeAddress.longitude,
          formattedAddress: address.trim(),
        });
      } else {
        setLocationError("Could not find location for the address.");
        setResolvedLocation(null);
      }
      setIsGeocodingAddress(false);
    },
    onError: (error) => {
      console.error('Geocoding error:', error);
      setLocationError('Failed to resolve address location');
      setResolvedLocation(null);
      setIsGeocodingAddress(false);
    }
  });

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setLocationError(null);

    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!newAddress.trim()) {
      setResolvedLocation(null);
      return;
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      setIsGeocodingAddress(true);

      geocodeAddress({
        variables: { address: newAddress.trim() }
      });
    }, 1500);

    setDebounceTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use the resolved/formatted address if available
    const finalAddress = resolvedLocation?.formattedAddress || address;

    UpdateUser({
      variables: {
        address: finalAddress,
        nickname: nickname,
      },
    });
  };

  return (
    <Box>
      <Dialog
        open={internalOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center" }}>Create User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>

            <TextField
              label="Nickname"
              type="text"
              fullWidth
              margin="normal"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <TextField
              label="Address"
              type="text"
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Search address"
              disabled={isGeocodingAddress}
            />

            {isGeocodingAddress && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Resolving address...
                </Typography>
              </Box>
            )}

            {locationError && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {locationError}
              </Alert>
            )}

            {resolvedLocation &&
              typeof resolvedLocation.latitude === "number" &&
              typeof resolvedLocation.longitude === "number" &&
              !isNaN(resolvedLocation.latitude) &&
              !isNaN(resolvedLocation.longitude) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Address: {resolvedLocation.formattedAddress}
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    {location ? (
                      <MapContainer
                        center={[resolvedLocation.latitude, resolvedLocation.longitude]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        />

                        <Marker position={[resolvedLocation.latitude, resolvedLocation.longitude]} icon={customIcon}>
                          <Popup>
                            You are here. <br /> Latitude: {resolvedLocation.latitude}, Longitude:{" "}
                            {resolvedLocation.longitude}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <Typography>Location not available.</Typography>
                    )}
                  </Box>
                </Box>
              )}
          </DialogContent>
          {mutationError && <Alert severity="error">{mutationError.message}</Alert>}
          {loading && (
            <CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />
          )}
          <DialogActions
            sx={{ flexDirection: "column", alignItems: "stretch", gap: 1 }}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                loading || address.trim() === "" || nickname.trim() === ""
              }
              sx={{ mt: 1 }}
            >
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          User created successfully!
        </Alert>
      )}
    </Box>
  );
};

export default UpdateUser;
