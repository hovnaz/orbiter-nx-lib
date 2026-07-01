import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PreviewState {
  active: boolean;
  topic: string;
  step: number;
}

const initialState: PreviewState = {
  active: false,
  topic: '',
  step: 0,
};

export const previewSlice = createSlice({
  name: 'preview',
  initialState,
  reducers: {
    startTour(state, action: PayloadAction<{ topic: string }>) {
      state.active = true;
      state.topic = action.payload.topic;
      state.step = 0;
    },
    stopTour(state) {
      state.active = false;
      state.step = 0;
    },
    setTourStep(state, action: PayloadAction<number>) {
      state.step = Math.max(0, action.payload);
    },
  },
});

export const { startTour, stopTour, setTourStep } = previewSlice.actions;

export const selectPreviewActive = (state: { preview: PreviewState }): boolean =>
  state.preview.active;

export const selectTourTopic = (state: { preview: PreviewState }): string =>
  state.preview.topic;

export const selectTourStep = (state: { preview: PreviewState }): number =>
  state.preview.step;
