/**
 * External dependencies
 */
import { capitalize } from 'lodash';

/**
 * WordPress dependencies
 */
import { modifiers, SHIFT, ALT, CTRL } from '@wordpress/keycodes';

const IS_MAC_OS = process.platform === 'darwin';

/**
 * Emulates a Ctrl+A SelectAll key combination by dispatching custom keyboard
 * events and using the results of those events to determine whether to call
 * `document.execCommand( 'selectall' );`. This is necessary because Puppeteer
 * does not emulate Ctrl+A SelectAll in macOS. Events are dispatched to ensure
 * that any `Event#preventDefault` which would have normally occurred in the
 * application as a result of Ctrl+A is respected.
 *
 * @link https://github.com/GoogleChrome/puppeteer/issues/1313
 * @link https://w3c.github.io/uievents/tools/key-event-viewer.html
 *
 * @return {Promise} Promise resolving once the SelectAll emulation completes.
 */
async function emulateSelectAll() {
	await page.evaluate( ( isMac ) => {
		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keydown', {
				bubbles: true,
				cancelable: true,
				key: isMac ? 'Meta' : 'Control',
				code: isMac ? 'MetaLeft' : 'ControlLeft',
				location: window.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
				getModifierState: ( keyArg ) => keyArg === ( isMac ? 'Meta' : 'Control' ),
				ctrl: ! isMac,
				meta: isMac,
				charCode: 0,
				keyCode: isMac ? 93 : 17,
				which: isMac ? 93 : 17,
			} )
		);

		const preventableEvent = new KeyboardEvent( 'keydown', {
			bubbles: true,
			cancelable: true,
			key: 'a',
			code: 'KeyA',
			location: window.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
			getModifierState: ( keyArg ) => keyArg === ( isMac ? 'Meta' : 'Control' ),
			ctrl: ! isMac,
			meta: isMac,
			charCode: 0,
			keyCode: 65,
			which: 65,
		} );

		const wasPrevented = (
			! document.activeElement.dispatchEvent( preventableEvent ) ||
			preventableEvent.defaultPrevented
		);

		if ( ! wasPrevented ) {
			document.execCommand( 'selectall', false, null );
		}

		document.activeElement.dispatchEvent(
			new KeyboardEvent( 'keyup', {
				bubbles: true,
				cancelable: true,
				key: isMac ? 'Meta' : 'Control',
				code: isMac ? 'MetaLeft' : 'ControlLeft',
				location: window.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
				getModifierState: () => false,
				charCode: 0,
				keyCode: isMac ? 93 : 17,
				which: isMac ? 93 : 17,
			} ),
		);
	}, IS_MAC_OS );
}

/**
 * Performs a key press with modifier (Shift, Control, Meta, Alt), where each modifier
 * is normalized to platform-specific modifier.
 *
 * @param {string} modifier Modifier key.
 * @param {string} key Key to press while modifier held.
 */
export async function pressKeyWithModifier( modifier, key ) {
	if ( modifier.toLowerCase() === 'primary' && key.toLowerCase() === 'a' ) {
		return await emulateSelectAll();
	}

	const overWrittenModifiers = {
		...modifiers,
		shiftAlt: ( _isApple ) => _isApple() ? [ SHIFT, ALT ] : [ SHIFT, CTRL ],
	};
	const mappedModifiers = overWrittenModifiers[ modifier ]( IS_MAC_OS );
	const ctrlSwap = ( mod ) => mod === CTRL ? 'control' : mod;

	await Promise.all(
		mappedModifiers.map( async ( mod ) => {
			const capitalizedMod = capitalize( ctrlSwap( mod ) );
			return page.keyboard.down( capitalizedMod );
		} )
	);

	await page.keyboard.press( key );

	await Promise.all(
		mappedModifiers.map( async ( mod ) => {
			const capitalizedMod = capitalize( ctrlSwap( mod ) );
			return page.keyboard.up( capitalizedMod );
		} )
	);
}
