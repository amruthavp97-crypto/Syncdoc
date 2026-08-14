import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  theme: "dark" | "light";
}

const initialState: UIState = {
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  theme: "dark",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<UIState["theme"]>) {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setCommandPaletteOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
