import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();

    // Handle snap URLs: /user/username/snap/permlink
    const snapMatch = url.pathname.match(/^\/user\/([^\/]+)\/snap\/([^\/]+)$/);

    if (snapMatch) {
        const [, username, permlink] = snapMatch;

        // Rewrite to the profile page with snaps view
        // The client-side will detect the URL structure and open the modal
        url.pathname = `/user/${username}`;
        url.searchParams.set('view', 'snaps');

        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    // Match user profile snap routes
    matcher: '/user/:username/snap/:permlink',
};
