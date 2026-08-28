import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FormacionComplementaria, FormacionComplementariaState } from '../../interfaces/formacioncomplementaria.interface';

export const formacionComplementariaSlice = createSlice({
	name: 'formacionComplementariaSlice',
	initialState: {
		formacionComplementaria: null,
		loading: false,
		error: null,
	} as FormacionComplementariaState,
	reducers: {
		setFormacionComplementaria: (state, action: PayloadAction<FormacionComplementaria[]>) => {
			state.formacionComplementaria = action.payload;
			state.loading = false;
			state.error = null;
		},
		setLoadingFormacionComplementaria: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setErrorFormacionComplementaria: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
	},
});

export const { setFormacionComplementaria, setLoadingFormacionComplementaria, setErrorFormacionComplementaria } =
formacionComplementariaSlice.actions;