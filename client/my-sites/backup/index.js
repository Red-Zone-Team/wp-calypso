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
	backupActivity,
	backupDownload,
	backupRestore,
	backups,
	showUpsellIfNoBackup,
} from 'my-sites/backup/controller';
import WPCOMUpsell from 'landing/jetpack-cloud/sections/wpcom-upsell';
import { backupMainPath, backupActivityPath, backupRestorePath, backupDownloadPath } from './paths';

export default function () {
	if ( config.isEnabled( 'jetpack-cloud' ) || config.isEnabled( 'jetpack/features-section' ) ) {
		/* handles /backup/activity, see `backupActivityPath` */
		page( backupActivityPath(), siteSelection, sites, makeLayout, clientRender );

		/* handles /backup/activity/:site, see `backupActivityPath` */
		page(
			backupActivityPath( ':site' ),
			siteSelection,
			navigation,
			backupActivity,
			wrapInSiteOffsetProvider,
			showUpsellIfNoBackup,
			wpcomUpsellController( WPCOMUpsell ),
			makeLayout,
			clientRender
		);

		/* handles /backup/:site/download/:rewindId, see `backupDownloadPath` */
		page(
			backupDownloadPath( ':site', ':rewindId' ),
			siteSelection,
			navigation,
			backupDownload,
			wrapInSiteOffsetProvider,
			wpcomUpsellController( WPCOMUpsell ),
			makeLayout,
			clientRender
		);

		if ( config.isEnabled( 'jetpack/backups-restore' ) ) {
			/* handles /backup/:site/restore/:rewindId, see `backupRestorePath` */
			page(
				backupRestorePath( ':site', ':rewindId' ),
				siteSelection,
				navigation,
				backupRestore,
				wrapInSiteOffsetProvider,
				wpcomUpsellController( WPCOMUpsell ),
				makeLayout,
				clientRender
			);
		}

		/* handles /backup/:site, see `backupMainPath` */
		page(
			backupMainPath( ':site' ),
			siteSelection,
			navigation,
			backups,
			wrapInSiteOffsetProvider,
			showUpsellIfNoBackup,
			wpcomUpsellController( WPCOMUpsell ),
			makeLayout,
			clientRender
		);
		/* handles /backups, see `backupMainPath` */
		page( backupMainPath(), siteSelection, sites, makeLayout, clientRender );
	} else {
		page( `${ backupMainPath() }*`, () => page.redirect( '/ ' ) );
	}
}
