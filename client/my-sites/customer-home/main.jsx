/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useTranslate } from 'i18n-calypso';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import { Button } from '@automattic/components';
import EmptyContent from 'components/empty-content';
import Main from 'components/main';
import { preventWidows } from 'lib/formatting';
import SidebarNavigation from 'my-sites/sidebar-navigation';
import FormattedHeader from 'components/formatted-header';
import { getSelectedSite, getSelectedSiteId } from 'state/ui/selectors';
import { canCurrentUserUseCustomerHome, getSiteOption } from 'state/sites/selectors';
import PageViewTracker from 'lib/analytics/page-view-tracker';
import DocumentHead from 'components/data/document-head';
import QuerySiteChecklist from 'components/data/query-site-checklist';
import withTrackingTool from 'lib/analytics/with-tracking-tool';
import { bumpStat, composeAnalytics, recordTracksEvent } from 'state/analytics/actions';
import { getSelectedEditor } from 'state/selectors/get-selected-editor';
import QueryHomeLayout from 'components/data/query-home-layout';
import { getHomeLayout } from 'state/selectors/get-home-layout';
import Primary from 'my-sites/customer-home/locations/primary';
import Secondary from 'my-sites/customer-home/locations/secondary';
import Tertiary from 'my-sites/customer-home/locations/tertiary';
import Experiment, { LoadingVariations, DefaultVariation, Variation } from 'components/experiment';

/**
 * Style dependencies
 */
import './style.scss';

const Home = ( {
	canUserUseCustomerHome,
	isDev,
	forcedView,
	layout,
	site,
	siteId,
	trackViewSiteAction,
} ) => {
	const translate = useTranslate();

	if ( ! canUserUseCustomerHome ) {
		const title = translate( 'This page is not available on this site.' );
		return (
			<EmptyContent
				title={ preventWidows( title ) }
				illustration="/calypso/images/illustrations/error.svg"
			/>
		);
	}

	const header = (
		<div className="customer-home__heading">
			<FormattedHeader
				headerText={ translate( 'My Home' ) }
				subHeaderText={ translate( 'Your home base for posting, editing, and growing your site.' ) }
				align="left"
			/>
			<div className="customer-home__view-site-button">
				<Button href={ site.URL } onClick={ trackViewSiteAction }>
					{ translate( 'View site' ) }
				</Button>
			</div>
		</div>
	);

	return (
		<Main className="customer-home__main is-wide-layout">
			<PageViewTracker path={ `/home/:site` } title={ translate( 'My Home' ) } />
			<DocumentHead title={ translate( 'My Home' ) } />
			{ siteId && <QuerySiteChecklist siteId={ siteId } /> }
			{ siteId && <QueryHomeLayout siteId={ siteId } isDev={ isDev } forcedView={ forcedView } /> }
			<SidebarNavigation />
			<Experiment name="user_home_test">
				<LoadingVariations>
					{ /* Normally, we'd load variations before this page could be visible. However, we'll just pretend
					     we did that so users have an unchanged experience.
					   */ }
					{ header }
				</LoadingVariations>
				<DefaultVariation name="control">{ header }</DefaultVariation>
				<Variation name="treatment">{ header }</Variation>
			</Experiment>
			{ layout ? (
				<>
					<Primary cards={ layout.primary } />
					<div className="customer-home__layout">
						<div className="customer-home__layout-col customer-home__layout-col-left">
							<Secondary cards={ layout.secondary } />
						</div>
						<div className="customer-home__layout-col customer-home__layout-col-right">
							<Tertiary cards={ layout.tertiary } />
						</div>
					</div>
				</>
			) : (
				<div className="customer-home__loading-placeholder"></div>
			) }
		</Main>
	);
};

Home.propTypes = {
	canUserUseCustomerHome: PropTypes.bool.isRequired,
	isDev: PropTypes.bool,
	isStaticHomePage: PropTypes.bool.isRequired,
	forcedView: PropTypes.string,
	layout: PropTypes.object,
	site: PropTypes.object.isRequired,
	siteId: PropTypes.number.isRequired,
	trackViewSiteAction: PropTypes.func.isRequired,
};

const mapStateToProps = ( state ) => {
	const siteId = getSelectedSiteId( state );
	const isClassicEditor = getSelectedEditor( state, siteId ) === 'classic';
	const layout = getHomeLayout( state, siteId );

	return {
		site: getSelectedSite( state ),
		siteId,
		canUserUseCustomerHome: canCurrentUserUseCustomerHome( state, siteId ),
		isStaticHomePage:
			! isClassicEditor && 'page' === getSiteOption( state, siteId, 'show_on_front' ),
		layout,
	};
};

const trackViewSiteAction = ( isStaticHomePage ) =>
	composeAnalytics(
		recordTracksEvent( 'calypso_customer_home_my_site_view_site_click', {
			is_static_home_page: isStaticHomePage,
		} ),
		bumpStat( 'calypso_customer_home', 'my_site_view_site' )
	);

const mapDispatchToProps = {
	trackViewSiteAction,
};

const mergeProps = ( stateProps, dispatchProps, ownProps ) => {
	const { isStaticHomePage } = stateProps;
	return {
		...ownProps,
		...stateProps,
		trackViewSiteAction: () => dispatchProps.trackViewSiteAction( isStaticHomePage ),
	};
};

const connectHome = connect( mapStateToProps, mapDispatchToProps, mergeProps );

export default flowRight( connectHome, withTrackingTool( 'HotJar' ) )( Home );
