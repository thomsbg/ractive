function badReference ( key ) {
	throw new Error( `An index or key reference (${key}) cannot have child properties` );
}

export default function resolveAmbiguousReference ( fragment, ref ) {
	const localViewmodel = fragment.findContext().root;
	const keys = ref.split( '.' );
	const key = keys[0];

	// TODO what if there are two component boundaries to cross - does this still work?
	const base = localViewmodel.mappings.hasOwnProperty( key ) ?
		localViewmodel.mappings[ key ] :
		localViewmodel.computations.hasOwnProperty( key ) ?
			localViewmodel.computations[ key ] :
			null;

	if ( base ) {
		return keys.length > 1 ?
			base.joinAll( keys.slice( 1 ) ) :
			base;
	}

	let hasContextChain;
	let crossedComponentBoundary;

	while ( fragment ) {
		// repeated fragments
		if ( fragment.isIteration ) {
			if ( key === fragment.parent.keyRef ) {
				if ( keys.length > 1 ) badReference( key );
				return fragment.context.getKeyModel();
			}

			if ( key === fragment.parent.indexRef ) {
				if ( keys.length > 1 ) badReference( key );
				return fragment.context.getIndexModel( fragment.index );
			}
		}

		if ( fragment.context ) {
			// TODO better encapsulate the component check
			if ( !fragment.isRoot || fragment.ractive.component ) hasContextChain = true;

			if ( fragment.context.has( key ) ) {
				if ( crossedComponentBoundary ) {
					localViewmodel.map( key, fragment.context.joinKey( key ) );
				}

				return fragment.context.joinAll( keys );
			}
		}

		if ( fragment.componentParent && !fragment.ractive.isolated ) {
			// ascend through component boundary
			fragment = fragment.componentParent;
			crossedComponentBoundary = true;
		} else {
			fragment = fragment.parent;
		}
	}

	if ( !hasContextChain ) {
		return localViewmodel.joinAll( keys );
	}
}
