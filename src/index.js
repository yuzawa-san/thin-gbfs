import React from 'react';
import ReactDOM from 'react-dom';
import { hcl } from 'd3-color';
import {DEFAULT_HUE, MAIN_LUMINANCE, ALT_LUMINANCE} from './components/HueControl';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
// import App from './components/App';
import LocationService from './components/LocationService';
import * as serviceWorker from './serviceWorker';

const hue = parseInt(localStorage.getItem("color") || DEFAULT_HUE, 10);
const mainColor = hcl(hue, 100, MAIN_LUMINANCE).toString();
const altColor = hcl(hue, 100, ALT_LUMINANCE).toString();
const theme = createMuiTheme({
	palette: {
		primary: {
			main: mainColor,
		},
		secondary: {
			main: altColor,
		},
  	},
	hue
});

const ThemedApp = () => {
	return (
		<MuiThemeProvider theme={theme}>
			<LocationService />
		</MuiThemeProvider>
	);
}


ReactDOM.render(<ThemedApp/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
