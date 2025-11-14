import React from "react";
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from "@mui/material";
import { Language } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Language />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          displayEmpty={true}
          variant="outlined"
          sx={{
            color: "#757575", // Grey color for selected value
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#bdbdbd", // Grey border
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#9e9e9e", // Darker grey on hover
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#757575", // Grey when focused
            },
          }}
        >
          <MenuItem value="en">{t("languages.en")}</MenuItem>
          <MenuItem value="zh-TW">{t("languages.zh-TW")}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSwitcher;
