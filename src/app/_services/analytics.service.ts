import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError, retry, retryWhen, delay, take } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private http: HttpClient) { }

  // initialization
  view_search_analytics = 'http://182.18.194.188/nms/authbasic/view_search_analytics';
  view_pinned_analytics = 'http://182.18.194.188/nms/authbasic/view_pinned_analytics';

  // account 
  get_associated_accounts = 'http://182.18.194.188/nms/authbasic/get_associated_accounts';

  // drop
  cm_info = 'http://182.18.194.188/nms/authbasic/cm_info';
  cpe_channels = 'http://182.18.194.188/nms/authbasic/cpeChannels';

  // plant
  summary_upstream = 'http://182.18.194.188/nms/authbasic/summaryupstream/';
  upstream = 'http://182.18.194.188/nms/authbasic/upstream/';

  // core
  summary_upstream_c = 'http://182.18.194.188/nms/authbasic/api/summaryupstream/';
  downstream = 'http://182.18.194.188/nms/authbasic/api/downstream/';
  
  // fault
  get_fault = 'http://182.18.194.188/nms/authbasic/get_fault';
  node_nims = 'http://182.18.194.188/nms/authbasic/node_nims';

  // others
  reset_cm = 'http://182.18.194.188/nms/authbasic/reset_cm';
  get_impared_cm = 'http://182.18.194.188/nms/authbasic/get_impared_cm';

  	// initialization
	initRecentSearch() 
	{
	    // now returns an Observable 
	    return this.http.post(this.view_search_analytics, [])
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	// retry(3),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	  		catchError(this.handleError)
		);
	}

	initPinnedSearch()
	{
	    // now returns an Observable 
	    return this.http.post(this.view_pinned_analytics, [])
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);
	}

	// account search
	accountSearch(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.get_associated_accounts, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	//drop 
	dropCmInfo(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.cm_info, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	dropCpeChannels(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.cpe_channels, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	//plant
	plantSummaryUpstream(cm_id)
	{
	    // now returns an Observable 
	    return this.http.get(this.summary_upstream + cm_id)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	plantUpstream(cm_id, days, data)
	{
	    // now returns an Observable 
	    return this.http.post(this.upstream + cm_id + '.' + days, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	//core
	coreSummaryUpstream(cm_id, days)
	{
	    // now returns an Observable 
	    return this.http.get(this.summary_upstream_c + cm_id + '.' + days + '.list')
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	coreDownstream(cm_id, days, data)
	{
	    // now returns an Observable 
	    return this.http.post(this.downstream + cm_id + '.' + days + '.list' , data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	// fault
	faultGet(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.get_fault, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	faultNims(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.node_nims, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	// others
	resetCm(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.reset_cm, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}

	impairedCm(data)
	{
	    // now returns an Observable 
	    return this.http.post(this.get_impared_cm, data)
	    .pipe(
	    	map(value => {
	    		// console.info('Succeed');
	    		return value;
	    	}),
	    	retryWhen(errors => errors.pipe(delay(2000), take(10))),
	    	// retry(3),
	  		catchError(this.handleError)
		);	
	}
	
	private handleError(error: HttpErrorResponse) 
	{
		console.log(error);
		if (error.error instanceof ErrorEvent) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error('An error occurred:', error.error.message);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong,
			console.error(`Backend returned code ${error.status}, ` +`body was: ${error.error}`);
		}
		// return an observable with a user-facing error message
		return throwError('Something bad happened; please try again later.');
	} 

}
