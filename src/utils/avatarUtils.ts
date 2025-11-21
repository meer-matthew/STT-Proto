/**
 * Avatar utility functions
 * Assigns consistent random avatars to users based on their username
 */

// Import all available avatars
const AVATARS = [
    require('../../assets/images/avatars/man.png'),
    require('../../assets/images/avatars/man-2.png'),
    require('../../assets/images/avatars/man-3.png'),
    require('../../assets/images/avatars/woman.png'),
    require('../../assets/images/avatars/woman-2.png'),
];

/**
 * Get a consistent avatar for a user based on their username
 * The same username will always get the same avatar
 *
 * @param username - The username to get avatar for
 * @returns The avatar image source
 */
export function getAvatarForUser(username: string): any {
    if (!username) {
        return AVATARS[0]; // Default avatar
    }

    // Generate a hash from the username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value to get positive index
    const index = Math.abs(hash) % AVATARS.length;
    return AVATARS[index];
}

/**
 * Get all available avatars
 * @returns Array of avatar image sources
 */
export function getAllAvatars(): any[] {
    return AVATARS;
}

/**
 * Get avatar names for debugging/logging
 * @returns Array of avatar file names
 */
export function getAvatarNames(): string[] {
    return [
        'man.png',
        'man-2.png',
        'man-3.png',
        'woman.png',
        'woman-2.png',
    ];
}
