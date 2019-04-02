/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Separator' ),

	description: __( 'Create a break between ideas or sections with a horizontal separator.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><Path d="M19 13H5v-2h14v2z" /></SVG>,

	keywords: [ __( 'horizontal-line' ), 'hr', __( 'divider' ) ],

	styles: [
		{ name: 'default', label: __( 'Default' ), isDefault: true },
		{ name: 'wide', label: __( 'Wide Line' ) },
		{ name: 'dots', label: __( 'Dots' ) },
	],

	transforms: {
		from: [
			{
				type: 'enter',
				regExp: /^-{3,}$/,
				transform: () => createBlock( 'core/separator' ),
			},
			{
				type: 'raw',
				selector: 'hr',
				schema: {
					hr: {},
				},
			},
		],
	},

	edit( { className } ) {
		return <hr className={ className } />;
	},

	save() {
		return <hr />;
	},
};
