// import * as Handlebars from 'handlebars';
import { idhandler } from '../tools/idhandler';
import EventEmitter from '../vendor/eventemitter3';

let templates = {};

export class Morsel {

	/**
	 * The parent object which all courses, sections, cards and activities extend
	 */
	constructor() {
		this.children = [];
		this.childrenElementID = idhandler.get();

		this.allChildrenRendered = false;

		/**
		 * The jQuery element of the model
		 * @type {null}
		 */
		this.element = $( '<div/>' );

		this.eventemitter = new EventEmitter();

		/**
		 * Is the model complete
		 * @type {boolean}
		 */
		this.isComplete = false;
		this.isRendered = false;
		this.isStarred = false;

		/**
		 * The template file to use, relative to /app/templates
		 * @type {null}
		 */
		this.view = null;

		this.parent = null;

		this.ns = '';

		/**
		 * The properties of the model
		 * @type {{}}
		 */
		this.properties = {};
		
	}

	/**
	 * Function to perform before the template renders
	 */
	preRender() {}

	/**
	 * Render the template of the model with the properties
	 * @returns {Promise}
	 */
	render( scope ) {
		scope = scope || this;

		scope.preRender();

		if( !templates[scope.view] ) {
			templates[scope.view] = new Promise( ( resolve, reject ) =>
				fetch( 'views/' + scope.view )
					.then( response => response.text() )
					.then( template => Handlebars.compile( template ) )
					.then( handlebar => resolve( handlebar ) )
					.catch( e => reject( e ) )
			);
		}

		return templates[scope.view]
			.then( handlebar => handlebar( scope ),
				e => console.error( 'Failed to render "' + scope.view + '": ', e.message ) )
			.then( html => scope.element.html( html ) )
			.then( () => {
				if( scope.children.length ) {
					for( let child in scope.children ) {
						let childElement = scope.element.find( '[data-childrenid="' + scope.childrenElementID + '"]' );

						if( childElement.length &&
								scope.children[child].element ) {
							childElement.replaceWith( scope.children[child].element );
						} else if( child > 0 ) {
							scope.children[child - 1].element.after( scope.children[child].element );
						}
					}
				}
			} )
			.then( () => scope.isRendered = true )
			.then( () => {
				scope.eventemitter.emit( 'postRender' + scope.ns, scope );
			} );
	}

	update( scope ) {

		scope = scope || this;

		if( !templates[scope.view] ) {
			console.warn( 'Not rendered yet' );
		}

		return this.render( scope );

	}

	checkAllChildrenRendered() {

		if( !this.allChildrenRendered ) {
			let allRendered = true;

			for( let child of this.children ) {
				if( !child.isRendered ) {
					allRendered = false;
					break;
				}
			}

			if( allRendered ) {
				this.allChildrenRendered = true;
				return true;
			}
		}

		return false;

	}

	addEventListeners() {}

}