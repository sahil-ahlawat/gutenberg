/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click, press, sleep, type, waitFor } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UncontrolledCustomSelectControl from '..';

const className = 'amber-skies';
const style = {
	backgroundColor: 'rgb(127, 255, 212)',
	rotate: '13deg',
};

const legacyProps = {
	label: 'label!',
	options: [
		{
			key: 'flower1',
			name: 'violets',
		},
		{
			key: 'flower2',
			name: 'crimson clover',
			className,
		},
		{
			key: 'flower3',
			name: 'poppy',
		},
		{
			key: 'color1',
			name: 'amber',
			className,
		},
		{
			key: 'color2',
			name: 'aquamarine',
			style,
		},
		{
			key: 'aquarela-key',
			name: 'aquarela',
			className,
			style,
		},
	],
};

const ControlledCustomSelectControl = ( {
	options,
	onChange,
	...restProps
}: React.ComponentProps< typeof UncontrolledCustomSelectControl > ) => {
	const { value: overrideValue } = restProps;
	const [ value, setValue ] = useState( options[ 0 ] );
	const initialValue = overrideValue ?? value;
	return (
		<UncontrolledCustomSelectControl
			{ ...restProps }
			options={ options }
			onChange={ ( args: any ) => {
				onChange?.( args );
				setValue( args.selectedItem );
			} }
			value={ options.find(
				( option: any ) => option.key === initialValue.key
			) }
		/>
	);
};

describe.each( [
	[ 'Uncontrolled', UncontrolledCustomSelectControl ],
	[ 'Controlled', ControlledCustomSelectControl ],
] )( 'CustomSelectControl (%s)', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	it( 'Should replace the initial selection when a new item is selected', async () => {
		render( <Component { ...legacyProps } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await click( currentSelectedItem );

		await click(
			screen.getByRole( 'option', {
				name: 'crimson clover',
			} )
		);

		expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );

		await click( currentSelectedItem );

		await click(
			screen.getByRole( 'option', {
				name: 'poppy',
			} )
		);

		expect( currentSelectedItem ).toHaveTextContent( 'poppy' );
	} );

	it( 'Should keep current selection if dropdown is closed without changing selection', async () => {
		render( <Component { ...legacyProps } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await sleep();
		await press.Tab();
		await press.Enter();
		expect(
			screen.getByRole( 'listbox', {
				name: 'label!',
			} )
		).toBeVisible();

		await press.Escape();
		expect(
			screen.queryByRole( 'listbox', {
				name: 'label!',
			} )
		).not.toBeInTheDocument();

		expect( currentSelectedItem ).toHaveTextContent(
			legacyProps.options[ 0 ].name
		);
	} );

	it( 'Should apply class only to options that have a className defined', async () => {
		render( <Component { ...legacyProps } /> );

		await click(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		);

		// return an array of items _with_ a className added
		const itemsWithClass = legacyProps.options.filter(
			( option ) => option.className !== undefined
		);

		// assert against filtered array
		itemsWithClass.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).toHaveClass(
				className
			)
		);

		// return an array of items _without_ a className added
		const itemsWithoutClass = legacyProps.options.filter(
			( option ) => option.className === undefined
		);

		// assert against filtered array
		itemsWithoutClass.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).not.toHaveClass(
				className
			)
		);
	} );

	it( 'Should apply styles only to options that have styles defined', async () => {
		const customStyles =
			'background-color: rgb(127, 255, 212); rotate: 13deg;';

		render( <Component { ...legacyProps } /> );

		await click(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		);

		// return an array of items _with_ styles added
		const styledItems = legacyProps.options.filter(
			( option ) => option.style !== undefined
		);

		// assert against filtered array
		styledItems.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).toHaveStyle(
				customStyles
			)
		);

		// return an array of items _without_ styles added
		const unstyledItems = legacyProps.options.filter(
			( option ) => option.style === undefined
		);

		// assert against filtered array
		unstyledItems.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).not.toHaveStyle(
				customStyles
			)
		);
	} );

	it( 'does not show selected hint by default', async () => {
		render(
			<Component
				{ ...legacyProps }
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						__experimentalHint: 'Hint',
					},
				] }
			/>
		);
		await waitFor( () =>
			expect(
				screen.getByRole( 'combobox', { name: 'Custom select' } )
			).not.toHaveTextContent( 'Hint' )
		);
	} );

	it( 'shows selected hint when __experimentalShowSelectedHint is set', async () => {
		render(
			<Component
				{ ...legacyProps }
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						__experimentalHint: 'Hint',
					},
				] }
				__experimentalShowSelectedHint
			/>
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'combobox', {
					expanded: false,
				} )
			).toHaveTextContent( /hint/i )
		);
	} );

	it( 'shows selected hint in list of options when added, regardless of __experimentalShowSelectedHint prop', async () => {
		render(
			<Component
				{ ...legacyProps }
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						__experimentalHint: 'Hint',
					},
				] }
			/>
		);

		await click(
			screen.getByRole( 'combobox', { name: 'Custom select' } )
		);

		expect( screen.getByRole( 'option', { name: /hint/i } ) ).toBeVisible();
	} );

	it( 'Should return object onChange', async () => {
		const mockOnChange = jest.fn();

		render( <Component { ...legacyProps } onChange={ mockOnChange } /> );

		await click(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		);

		expect( mockOnChange ).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining( {
				inputValue: '',
				isOpen: false,
				selectedItem: { key: 'flower1', name: 'violets' },
				type: '',
			} )
		);

		await click(
			screen.getByRole( 'option', {
				name: 'aquamarine',
			} )
		);

		expect( mockOnChange ).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining( {
				inputValue: '',
				isOpen: false,

				selectedItem: expect.objectContaining( {
					name: 'aquamarine',
				} ),
				type: '',
			} )
		);
	} );

	it( 'Should return selectedItem object when specified onChange', async () => {
		const mockOnChange = jest.fn(
			( { selectedItem } ) => selectedItem.key
		);

		render( <Component { ...legacyProps } onChange={ mockOnChange } /> );

		await sleep();
		await press.Tab();
		expect(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		).toHaveFocus();

		await type( 'p' );
		await press.Enter();

		expect( mockOnChange ).toHaveReturnedWith( 'flower1' );
	} );

	describe( 'Keyboard behavior and accessibility', () => {
		it( 'Should be able to change selection using keyboard', async () => {
			render( <Component { ...legacyProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await sleep();
			await press.Tab();
			expect( currentSelectedItem ).toHaveFocus();

			await press.Enter();
			expect(
				screen.getByRole( 'listbox', {
					name: 'label!',
				} )
			).toHaveFocus();

			await press.ArrowDown();
			await press.Enter();

			expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );
		} );

		it( 'Should be able to type characters to select matching options', async () => {
			render( <Component { ...legacyProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await sleep();
			await press.Tab();
			await press.Enter();
			expect(
				screen.getByRole( 'listbox', {
					name: 'label!',
				} )
			).toHaveFocus();

			await type( 'a' );
			await press.Enter();
			expect( currentSelectedItem ).toHaveTextContent( 'amber' );
		} );

		it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
			render( <Component { ...legacyProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await sleep();
			await press.Tab();
			expect( currentSelectedItem ).toHaveFocus();
			expect( currentSelectedItem ).toHaveTextContent( 'violets' );

			// Ideally we would test a multi-character typeahead, but anything more than a single character is flaky
			await type( 'a' );

			expect(
				screen.queryByRole( 'listbox', {
					name: 'label!',
					hidden: true,
				} )
			).not.toBeInTheDocument();

			// This Enter is a workaround for flakiness, and shouldn't be necessary in an actual browser
			await press.Enter();

			expect( currentSelectedItem ).toHaveTextContent( 'amber' );
		} );

		it( 'Should have correct aria-selected value for selections', async () => {
			render( <Component { ...legacyProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await click( currentSelectedItem );

			// get all items except for first option
			const unselectedItems = legacyProps.options.filter(
				( { name } ) => name !== legacyProps.options[ 0 ].name
			);

			// assert that all other items have aria-selected="false"
			unselectedItems.map( ( { name } ) =>
				expect(
					screen.getByRole( 'option', { name, selected: false } )
				).toBeVisible()
			);

			// assert that first item has aria-selected="true"
			expect(
				screen.getByRole( 'option', {
					name: legacyProps.options[ 0 ].name,
					selected: true,
				} )
			).toBeVisible();

			// change the current selection
			await click( screen.getByRole( 'option', { name: 'poppy' } ) );

			// click combobox to mount listbox with options again
			await click( currentSelectedItem );

			// check that first item is has aria-selected="false" after new selection
			expect(
				screen.getByRole( 'option', {
					name: legacyProps.options[ 0 ].name,
					selected: false,
				} )
			).toBeVisible();

			// check that new selected item now has aria-selected="true"
			expect(
				screen.getByRole( 'option', {
					name: 'poppy',
					selected: true,
				} )
			).toBeVisible();
		} );
	} );

	// V1 styles items via a `style` or `className` metadata property in the option item object. Some consumers still expect it, e.g:
	//
	// - https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/font-appearance-control/index.js#L216
	//
	// Returning these properties as part of the item object was not tested as part of the V1 test. Possibly this was an accidental API?
	// or was it intentional? If intentional, we might need to implement something similar in V2, too? The alternative is to rely on the
	// `key` attriute for the item and get the actual data from some dictionary in a store somewhere, which would require refactoring
	// consumers that rely on the self-contained `style` and `className` attributes.
	it( 'Should return style metadata as part of the selected option from onChange', async () => {
		const mockOnChange = jest.fn();

		render( <Component { ...legacyProps } onChange={ mockOnChange } /> );

		await click(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		);

		await click(
			screen.getByRole( 'option', {
				name: 'aquarela',
			} )
		);

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				selectedItem: expect.objectContaining( {
					className,
					style,
				} ),
			} )
		);
	} );

	it( 'Should display the initial value passed as the selected value', async () => {
		const initialSelectedItem = legacyProps.options[ 5 ];

		const testProps = {
			...legacyProps,
			value: initialSelectedItem,
		};

		render( <Component { ...testProps } /> );

		const currentSelectedItem = await screen.findByRole( 'combobox', {
			expanded: false,
		} );

		// Verify the initial selected value
		expect( currentSelectedItem ).toHaveTextContent( 'aquarela' );
	} );
} );
