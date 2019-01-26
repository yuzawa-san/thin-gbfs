
export const CURRENT_LOCATION_EMOJI_CODE = "1F535";
export const STATION_EMOJI_CODES = [ // list of emoji
	"1F3E0", // home
	"1F3E2", // work
	"1F498", // lover
	"1F4AA", // gym
	"1F46A", // family
	"1F3BD", // other gym
	"1F393", // school
	"1F689", // metro station
	"1F6A2", // ferry
	"1F17F", // parking lot
	"1F332", // park
	"1F37A", // bar
	"1F45C", // mall
	"1F35E", // food store
	"1F374", // restaurant
	"26EA", // church 
];
const EMOJI_VARIANT = String.fromCodePoint(0xFE0F);
export const UNFAVORITE_EMOJI = String.fromCodePoint(0x1F494) + EMOJI_VARIANT;
export const FAVORITE_EMOJI = String.fromCodePoint(0x2764) + EMOJI_VARIANT;
export const emojiString = (codePoint, isFavorite) => {
	if (!codePoint) {
		if (isFavorite) {
			return FAVORITE_EMOJI;
		}
		return codePoint;
	}
	return String.fromCodePoint(parseInt(codePoint, 16)) + EMOJI_VARIANT
}