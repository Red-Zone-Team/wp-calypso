/**
 * External dependencies
 */
import page from 'page';

/**
 * Internal dependencies
 */
import config from 'config';

import { navigation, siteSelection, sites } from 'my-sites/controller';
import { makeLayout, render as clientRender } from 'controller';
import wrapInSiteOffsetProvider from 'lib/jetpack/wrap-in-site-offset';
import wpcomUpsellController from 'lib/jetpack/wpcom-upsell-controller';
import {
	showUpsellIfNoScan,
	showUpsellIfNoScanHistory,
	scan,
	scanHistory,
} from 'my-sites/scan/controller';
import WPCOMUpsell from 'landing/jetpack-cloud/sections/wpcom-upsell';

export default function () {
	if ( config.isEnabled( 'jetpack-cloud' ) || config.isEnabled( 'jetpack/features-section' ) ) {
		page( '/scan', siteSelection, sites, navigation, makeLayout, clientRender );
		page(
			'/scan/:site',
			siteSelection,
			navigation,
			scan,
			wrapInSiteOffsetProvider,
			showUpsellIfNoScan,
			wpcomUpsellController( WPCOMUpsell ),
			makeLayout,
			clientRender
		);

		page(
			'/scan/history/:site/:filter?',
			siteSelection,
			navigation,
			scanHistory,
			wrapInSiteOffsetProvider,
			showUpsellIfNoScanHistory,
			wpcomUpsellController( WPCOMUpsell ),
			makeLayout,
			clientRender
		);

		page(
			'/scan/:site/:filter?',
			siteSelection,
			navigation,
			scan,
			wrapInSiteOffsetProvider,
			showUpsellIfNoScan,
			wpcomUpsellController( WPCOMUpsell ),
			makeLayout,
			clientRender
		);
	} else {
		page( '/scan*', () => page.redirect( '/' ) );
	}
}
