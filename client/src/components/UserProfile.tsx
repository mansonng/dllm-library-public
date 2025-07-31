import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
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
  CreateUserMutation,
  CreateUserMutationVariables,
} from "../generated/graphql";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Create a custom icon using Leaflet's default marker
const customIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 23],
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
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($email: String!, $address: String, $nickname: String) {
    createUser(email: $email, address: $address, nickname: $nickname) {
      id
      email
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
  }
`;

interface UserProfileProps {
  email?: string | null | undefined;
  onUserCreated?: (data: UpdateUserMutation | CreateUserMutation) => void;
  open?: boolean;
  onClose?: () => void;
  isCreateUser?: boolean; // New parameter to determine create vs update
  initialNickname?: string | undefined | null; // For pre-filling when updating
  initialAddress?: string | undefined | null; // For pre-filling when updating
}

const UserProfile: React.FC<UserProfileProps> = ({
  email,
  onUserCreated,
  open = true,
  onClose,
  isCreateUser = false,
  initialNickname = "",
  initialAddress = "",
}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(open);
  const [address, setAddress] = useState(initialAddress || "");
  const [nickname, setNickname] = useState(initialNickname || "");
  const [resolvedLocation, setResolvedLocation] = useState<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Update mutation
  const [
    updateUser,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation<UpdateUserMutation, UpdateUserMutationVariables>(
    UPDATE_USER_MUTATION,
    {
      onCompleted: (data) => {
        if (onUserCreated) onUserCreated(data);
        handleClose();
        resetForm();
      },
    }
  );

  // Create mutation
  const [
    createUser,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation<CreateUserMutation, CreateUserMutationVariables>(
    CREATE_USER_MUTATION,
    {
      onCompleted: (data) => {
        if (onUserCreated) onUserCreated(data);
        handleClose();
        resetForm();
      },
    }
  );

  // Determine which mutation data/loading/error to use
  const data = isCreateUser ? createData : updateData;
  const loading = isCreateUser ? createLoading : updateLoading;
  const mutationError = isCreateUser ? createError : updateError;

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  const resetForm = () => {
    setAddress(initialAddress || "");
    setNickname(initialNickname || "");
    setResolvedLocation(null);
    setLocationError(null);
  };

  // Update internal state when props change
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  useEffect(() => {
    setAddress(initialAddress || "");
    setNickname(initialNickname || "");
  }, [initialAddress, initialNickname]);

  const [geocodeAddress, { loading: geocodeLoading }] = useLazyQuery(
    GET_GEO_DETAILS,
    {
      onCompleted: (data) => {
        if (data && data.geocodeAddress) {
          setResolvedLocation({
            latitude: data.geocodeAddress.latitude,
            longitude: data.geocodeAddress.longitude,
            formattedAddress: address ? address.trim() : "",
          });
        } else {
          setLocationError("Could not find location for the address.");
          setResolvedLocation(null);
        }
        setIsGeocodingAddress(false);
      },
      onError: (error) => {
        console.error("Geocoding error:", error);
        setLocationError("Failed to resolve address location");
        setResolvedLocation(null);
        setIsGeocodingAddress(false);
      },
    }
  );

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
        variables: { address: newAddress.trim() },
      });
    }, 1500);

    setDebounceTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use the resolved/formatted address if available
    const finalAddress = resolvedLocation?.formattedAddress || address;

    const variables = {
      email: email || "",
      address: finalAddress,
      nickname: nickname,
    };

    // Call the appropriate mutation based on isCreateUser
    if (isCreateUser) {
      createUser({ variables });
    } else {
      updateUser({ variables });
    }
  };

  return (
    <Box>
      <Dialog open={internalOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>
          {isCreateUser ? t("auth.createProfile") : t("auth.editProfile")}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label={t("userProfile.nickname")}
              type="text"
              fullWidth
              margin="normal"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />

            <TextField
              label={t("userProfile.address")}
              type="text"
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder={t("userProfile.searchAddress")}
              disabled={isGeocodingAddress}
              required
            />

            {isGeocodingAddress && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t("userProfile.resolvingAddress")}
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {t("userProfile.currentAddress")}: {resolvedLocation.formattedAddress}
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <MapContainer
                      center={[
                        resolvedLocation.latitude,
                        resolvedLocation.longitude,
                      ]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                      />

                      <Marker
                        position={[
                          resolvedLocation.latitude,
                          resolvedLocation.longitude,
                        ]}
                        icon={customIcon}
                      >
                        <Popup>
                          {t("location.here")} <br /> {t("location.latitude")}:{" "}
                          {resolvedLocation.latitude}, {t("location.longitude")}:{" "}
                          {resolvedLocation.longitude}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </Box>
                </Box>
              )}
          </DialogContent>

          {mutationError && (
            <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
              {mutationError.message}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          )}

          <DialogActions
            sx={{
              flexDirection: "column",
              alignItems: "stretch",
              gap: 1,
              p: 3,
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              {t("auth.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                loading ||
                address?.trim() === "" ||
                nickname?.trim() === "" ||
                isGeocodingAddress
              }
            >
              {loading
                ? isCreateUser
                  ? t("common.creating")
                  : t("common.updating")
                : isCreateUser
                  ? t("auth.createProfile")
                  : t("userProfile.updateProfile")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {isCreateUser
            ? t("userProfile.createSuccess")
            : t("userProfile.updateSuccess")}
        </Alert>
      )}
    </Box>
  );
};

export default UserProfile;
