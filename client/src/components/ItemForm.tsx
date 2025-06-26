import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CreateItemMutation,
  CreateItemMutationVariables,
  ItemCondition,
  ItemStatus,
  Language,
} from "../generated/graphql";

const CREATE_ITEM_MUTATION = gql`
  mutation CreateItem(
    $name: String!
    $category: [String!]!
    $condition: ItemCondition!
    $description: String
    $images: [String!]
    $language: Language!
    $publishedYear: Int
    $status: ItemStatus!
  ) {
    createItem(
      name: $name
      category: $category
      condition: $condition
      description: $description
      images: $images
      language: $language
      publishedYear: $publishedYear
      status: $status
    ) {
      id
      name
      description
      condition
      category
      status
      images
      gsImageUrls
      publishedYear
      language
      location {
        geohash
        latitude
        longitude
      }
      createdAt
      ownerId
      updatedAt
    }
  }
`;

interface ItemFormProps {
  onItemCreated?: (data: CreateItemMutation) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ onItemCreated }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.New);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>(Language.En);
  const [publishedYear, setPublishedYear] = useState<number | "">("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.Available);
  const [formError, setFormError] = useState<string | null>(null);

  const [createItem, { data, loading, error }] = useMutation<
    CreateItemMutation,
    CreateItemMutationVariables
  >(CREATE_ITEM_MUTATION, {
    onCompleted: (data) => {
      if (onItemCreated) onItemCreated(data);
      handleClose();
    },
  });

  const handleClickOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setName("");
    setCategory("");
    setCondition(ItemCondition.New);
    setDescription("");
    setImages([]);
    setLanguage(Language.En);
    setPublishedYear("");
    setStatus(ItemStatus.Available);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !category.trim()) {
      setFormError("Name and category are required.");
      return;
    }
    setFormError(null);

    // Build variables object, only including non-empty optional fields
    const variables: any = {
      name,
      category: category.split(",").map((c) => c.trim()).filter(Boolean),
      condition,
      language,
      status,
    };

    // Only add optional fields if they have values
    if (description && description.trim()) {
      variables.description = description;
    }

    if (images && images.length > 0) {
      const validImages = images.filter(img => img && img.trim());
      if (validImages.length > 0) {
        variables.images = validImages;
      }
    }

    if (publishedYear !== "" && publishedYear !== null) {
      variables.publishedYear = Number(publishedYear);
    }

    await createItem({ variables });
  };

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Create Item
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ textAlign: "center" }}>Create New Item</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Category (comma-separated)"
              fullWidth
              margin="normal"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              helperText="e.g. Book,Magazine"
            />
            <TextField
              select
              label="Condition"
              fullWidth
              margin="normal"
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value as ItemCondition)}
            >
              {Object.values(ItemCondition).map((cond) => (
                <MenuItem key={cond} value={cond}>
                  {cond}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Optional"
            />
            <TextField
              label="Images (comma-separated URLs)"
              fullWidth
              margin="normal"
              value={images.join(",")}
              onChange={(e) =>
                setImages(
                  e.target.value
                    .split(",")
                    .map((img) => img.trim())
                    .filter(Boolean)
                )
              }
              helperText="Optional: e.g. https://example.com/image1.jpg,https://example.com/image2.jpg"
            />
            <TextField
              select
              label="Language"
              fullWidth
              margin="normal"
              required
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              {Object.values(Language).map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {lang}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Published Year"
              type="number"
              fullWidth
              margin="normal"
              value={publishedYear}
              onChange={(e) => {
                const val = e.target.value;
                setPublishedYear(val === "" ? "" : Number(val));
              }}
              inputProps={{ min: 1000, max: 9999 }}
              helperText="Optional: Enter a 4-digit year, e.g. 2024"
            />
            <TextField
              select
              label="Status"
              fullWidth
              margin="normal"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemStatus)}
            >
              {Object.values(ItemStatus).map((stat) => (
                <MenuItem key={stat} value={stat}>
                  {stat}
                </MenuItem>
              ))}
            </TextField>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error.message}
              </Alert>
            )}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            <Button
              onClick={handleClose}
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 1 }}
              disabled={loading}
            >
              Create Item
            </Button>
          </DialogContent>
        </form>
      </Dialog>
      {data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Item created successfully!
        </Alert>
      )}
    </Box>
  );
};

export default ItemForm;