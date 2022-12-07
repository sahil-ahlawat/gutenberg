/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo } from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';

/** @typedef {import('../../selectors').WPDirectInsertBlock } WPDirectInsertBlock */

const pendingSettingsUpdates = new WeakMap();

/**
 * This hook is a side effect which updates the block-editor store when changes
 * happen to inner block settings. The given props are transformed into a
 * settings object, and if that is different from the current settings object in
 * the block-editor store, then the store is updated with the new settings which
 * came from props.
 *
 * @param {string}               clientId                   The client ID of the block to update.
 * @param {string[]}             allowedBlocks              An array of block names which are permitted
 *                                                          in inner blocks.
 * @param {?WPDirectInsertBlock} __experimentalDefaultBlock The default block to insert: [ blockName, { blockAttributes } ].
 * @param {?Function|boolean}    __experimentalDirectInsert If a default block should be inserted directly by the
 *                                                          appender.
 * @param {string}               [templateLock]             The template lock specified for the inner
 *                                                          blocks component. (e.g. "all")
 * @param {boolean}              captureToolbars            Whether or children toolbars should be shown
 *                                                          in the inner blocks component rather than on
 *                                                          the child block.
 * @param {string}               orientation                The direction in which the block
 *                                                          should face.
 * @param {Object}               layout                     The layout object for the block container.
 */
export default function useNestedSettingsUpdate(
	clientId,
	allowedBlocks,
	__experimentalDefaultBlock,
	__experimentalDirectInsert,
	templateLock,
	captureToolbars,
	orientation,
	layout
) {
	const { updateBlockListSettings } = useDispatch( blockEditorStore );
	const registry = useRegistry();

	const { blockListSettings, parentLock } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockListSettings,
				getTemplateLock,
			} = select( blockEditorStore );

			const rootClientId = getBlockRootClientId( clientId );
			return {
				blockListSettings: getBlockListSettings( clientId ),
				parentLock: getTemplateLock( rootClientId ) ?? false,
			};
		},
		[ clientId ]
	);

	// Memoize as inner blocks implementors often pass a new array on every
	// render.
	const _allowedBlocks = useMemo( () => allowedBlocks, allowedBlocks );

	useLayoutEffect( () => {
		const newSettings = {
			allowedBlocks: _allowedBlocks,
			templateLock:
				templateLock === undefined || parentLock === 'contentOnly'
					? parentLock
					: templateLock,
		};

		// These values are not defined for RN, so only include them if they
		// are defined.
		if ( captureToolbars !== undefined ) {
			newSettings.__experimentalCaptureToolbars = captureToolbars;
		}

		// Orientation depends on layout,
		// ideally the separate orientation prop should be deprecated.
		if ( orientation !== undefined ) {
			newSettings.orientation = orientation;
		} else {
			const layoutType = getLayoutType( layout?.type );
			newSettings.orientation = layoutType.getOrientation( layout );
		}

		if ( __experimentalDefaultBlock !== undefined ) {
			newSettings.__experimentalDefaultBlock = __experimentalDefaultBlock;
		}

		if ( __experimentalDirectInsert !== undefined ) {
			newSettings.__experimentalDirectInsert = __experimentalDirectInsert;
		}

		if ( ! isShallowEqual( blockListSettings, newSettings ) ) {
			// Batch updates to block list settings to avoid triggering cascading renders
			// for each container block included in a tree and optimize initial render.
			// To avoid triggering updateBlockListSettings for each container block
			// causing X re-renderings for X container blocks,
			// we batch all the updatedBlockListSettings in a single "data" batch
			// which results in a single re-render.
			if ( ! pendingSettingsUpdates.get( registry ) ) {
				pendingSettingsUpdates.set( registry, [] );
			}
			pendingSettingsUpdates
				.get( registry )
				.push( [ clientId, newSettings ] );
			window.queueMicrotask( () => {
				if ( pendingSettingsUpdates.get( registry )?.length ) {
					registry.batch( () => {
						pendingSettingsUpdates
							.get( registry )
							.forEach( ( args ) => {
								updateBlockListSettings( ...args );
							} );
						pendingSettingsUpdates.set( registry, [] );
					} );
				}
			} );
		}
	}, [
		clientId,
		blockListSettings,
		_allowedBlocks,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		templateLock,
		parentLock,
		captureToolbars,
		orientation,
		updateBlockListSettings,
		layout,
		registry,
	] );
}
