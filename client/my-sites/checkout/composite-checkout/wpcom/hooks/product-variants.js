/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useTranslate } from 'i18n-calypso';
import { useSelector, useDispatch } from 'react-redux';
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import { requestPlans } from 'state/plans/actions';
import { computeProductsWithPrices } from 'state/products-list/selectors';
import { getPlan, findPlansKeys } from 'lib/plans';
import { GROUP_WPCOM, TERM_ANNUALLY, TERM_BIENNIALLY, TERM_MONTHLY } from 'lib/plans/constants';
import { requestProductsList } from 'state/products-list/actions';

const debug = debugFactory( 'calypso:composite-checkout:product-variants' );

export function useWpcomProductVariants( { siteId, productSlug, credits, couponDiscounts } ) {
	const translate = useTranslate();
	const reduxDispatch = useDispatch();

	const variantProductSlugs = useVariantWpcomPlanProductSlugs( productSlug );

	const productsWithPrices = useSelector( ( state ) => {
		return computeProductsWithPrices(
			state,
			siteId,
			variantProductSlugs, // : WPCOMProductSlug[]
			credits || 0, // : number
			couponDiscounts || {} // object of product ID / absolute amount pairs
		);
	} );

	const [ haveFetchedProducts, setHaveFetchedProducts ] = useState( false );
	const shouldFetchProducts = ! productsWithPrices;

	useEffect( () => {
		debug( 'deciding whether to request product variant data' );
		if ( shouldFetchProducts && ! haveFetchedProducts ) {
			debug( 'dispatching request for product variant data' );
			reduxDispatch( requestPlans() );
			reduxDispatch( requestProductsList() );
			setHaveFetchedProducts( true );
		}
	}, [ shouldFetchProducts, haveFetchedProducts, reduxDispatch ] );

	return ( anyProductSlug ) => {
		if ( anyProductSlug !== productSlug ) {
			return [];
		}

		return productsWithPrices.map( ( variant ) => ( {
			variantLabel: getTermText( variant.plan.term, translate ),
			variantDetails: (
				<VariantPrice variant={ variant } productsWithPrices={ productsWithPrices } />
			),
			productSlug: variant.planSlug,
			productId: variant.product.product_id,
		} ) );
	};
}

function VariantPrice( { variant, productsWithPrices } ) {
	const highestMonthlyPrice = Math.max(
		...productsWithPrices.map( ( product ) => {
			return product.priceMonthly;
		} )
	);

	const percentSavings = ( monthlyPrice ) => {
		const savings = Math.round( 100 * ( 1 - monthlyPrice / highestMonthlyPrice ) );
		return savings > 0 ? <Discount>-{ savings.toString() }%</Discount> : null;
	};

	const highestTermPrice = ( term ) => {
		if ( term !== TERM_BIENNIALLY ) {
			return;
		}
		const annualPrice = Math.round( 100 * 24 * highestMonthlyPrice );
		return <DoNotPayThis>{ localizeCurrency( annualPrice, 'USD' ) }</DoNotPayThis>;
	};

	return (
		<React.Fragment>
			{ percentSavings( variant.priceMonthly ) }
			{ highestTermPrice( variant.plan.term ) }
			{ variant.product.cost_display }
		</React.Fragment>
	);
}

function useVariantWpcomPlanProductSlugs( productSlug ) {
	const reduxDispatch = useDispatch();

	const chosenPlan = getPlan( productSlug );

	const [ haveFetchedPlans, setHaveFetchedPlans ] = useState( false );
	const shouldFetchPlans = ! chosenPlan;

	useEffect( () => {
		// Trigger at most one HTTP request
		debug( 'deciding whether to request plan variant data' );
		if ( shouldFetchPlans && ! haveFetchedPlans ) {
			debug( 'dispatching request for plan variant data' );
			reduxDispatch( requestPlans() );
			reduxDispatch( requestProductsList() );
			setHaveFetchedPlans( true );
		}
	}, [ haveFetchedPlans, shouldFetchPlans, reduxDispatch ] );

	if ( ! chosenPlan ) {
		return [];
	}

	// Only construct variants for WP.com plans
	if ( chosenPlan.group !== GROUP_WPCOM ) {
		return [];
	}

	// : WPCOMProductSlug[]
	return findPlansKeys( {
		group: chosenPlan.group,
		type: chosenPlan.type,
	} );
}

function getTermText( term, translate ) {
	switch ( term ) {
		case TERM_BIENNIALLY:
			return translate( 'Two years' );

		case TERM_ANNUALLY:
			return translate( 'One year' );

		case TERM_MONTHLY:
			return translate( 'One month' );
	}
}

// TODO: replace this with a real localize function
function localizeCurrency( amount ) {
	const decimalAmount = ( amount / 100 ).toFixed( 2 );
	return `$${ decimalAmount }`;
}

const Discount = styled.span`
	color: ${ ( props ) => props.theme.colors.discount };
	margin-right: 8px;
`;

const DoNotPayThis = styled.span`
	text-decoration: line-through;
	margin-right: 8px;
`;
