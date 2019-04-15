<?php
/**
 * QSF Portal
 * Copyright (c) 2006-2019 The QSF Portal Development Team
 * https://github.com/Arthmoor/QSF-Portal
 *
 * Based on:
 *
 * Quicksilver Forums
 * Copyright (c) 2005-2011 The Quicksilver Forums Development Team
 * https://github.com/Arthmoor/Quicksilver-Forums
 *
 * MercuryBoard
 * Copyright (c) 2001-2006 The Mercury Development Team
 * https://github.com/markelliot/MercuryBoard
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 **/

if( !defined( 'QUICKSILVERFORUMS' ) ) {
	header( 'HTTP/1.0 403 Forbidden' );
	die;
}

/**
 * User class
 *
 * @author Mark Elliot <mark.elliot@mercuryboard.com>
 * @since 1.0.1
 **/
class user
{
	/**
	 * Constructor
	 *
	 * @param $qsf - Quicksilver Forums module
	 **/
	public function __construct( &$qsf )
	{
		$this->db      = &$qsf->db;
		$this->pre     = &$qsf->pre;
		$this->server  = &$qsf->server;
		$this->cookie  = &$qsf->cookie;
		$this->sets    = &$qsf->sets;
		$this->time    = &$qsf->time;
		$this->ip      = &$qsf->ip;
	}

	/**
	 * Check for a session or cookie for a logged in user and return it or return
	 * the guest user using USER_GUEST_UID
	 *
	 * @return user record set
	 **/
	public function login()
	{
		if( isset( $this->cookie[$this->sets['cookie_prefix'] . 'user'] ) && isset( $this->cookie[$this->sets['cookie_prefix'] . 'pass'] ) ) {
			$cookie_user = intval( $this->cookie[$this->sets['cookie_prefix'] . 'user'] );
			$cookie_pass = $this->cookie[$this->sets['cookie_prefix'] . 'pass'];

			$user = $this->db->fetch( "SELECT m.*, s.skin_id, g.group_perms, g.group_file_perms, g.group_name, t.membertitle_icon
				FROM (%pskins s, %pgroups g, %pusers m)
				LEFT JOIN %pmembertitles t ON t.membertitle_id = m.user_level
				WHERE m.user_id=%d AND m.user_password='%s' AND s.skin_id=m.user_skin AND g.group_id=m.user_group
				LIMIT 1", $cookie_user, $cookie_pass );
		} else if( isset( $_SESSION['user'] ) && isset( $_SESSION['pass'] ) ) {
			$session_user = intval( $_SESSION['user'] );
			$session_pass = $_SESSION['pass'];

			$user = $this->db->fetch( "SELECT m.*, s.skin_id, g.group_perms, g.group_file_perms, g.group_name, t.membertitle_icon
				FROM (%pskins s, %pgroups g, %pusers m)
				LEFT JOIN %pmembertitles t ON t.membertitle_id = m.user_level
				WHERE m.user_id=%d AND MD5(CONCAT(m.user_password,'%s'))='%s' AND s.skin_id=m.user_skin AND g.group_id=m.user_group
				LIMIT 1", $session_user, $this->ip, $session_pass );
		} else {
			$user = $this->db->fetch( "SELECT m.*, s.skin_id, g.group_perms, g.group_file_perms, g.group_name
				FROM (%pskins s, %pgroups g, %pusers m)
				WHERE m.user_id=%d AND s.skin_id=m.user_skin AND g.group_id=m.user_group
				LIMIT 1", USER_GUEST_UID );

			$user['user_language'] = $this->get_browser_lang( $this->sets['default_lang'] );
		}

		if( !isset( $user['user_id'] ) ) {
			$user = $this->db->fetch( "SELECT m.*, s.skin_id, g.group_perms, g.group_file_perms, g.group_name
				FROM (%pskins s, %pgroups g, %pusers m)
				WHERE m.user_id=%d AND s.skin_id=m.user_skin AND g.group_id=m.user_group
				LIMIT 1", USER_GUEST_UID );

			setcookie( $this->sets['cookie_prefix'] . 'user', '', $this->time - 9000, $this->sets['cookie_path'], $this->sets['cookie_domain'], $this->sets['cookie_secure'], true );
			setcookie( $this->sets['cookie_prefix'] . 'pass', '', $this->time - 9000, $this->sets['cookie_path'], $this->sets['cookie_domain'], $this->sets['cookie_secure'], true );

			unset( $_SESSION['user'] );
			unset( $_SESSION['pass'] );

			$user['user_language'] = $this->get_browser_lang( $this->sets['default_lang'] );
		}

		if( !$this->is_skin_valid( $user['user_skin'] ) ) {
			$user['user_skin'] = 1;

			$this->db->query( "UPDATE %pusers SET user_skin=1 WHERE user_id=%d", $user['user_id'] );
		}

		return $user;
	}

   	/**
	 * Validate whether or not a user's skin setting is still valid.
	 * If not, reset to the default skin, which should never be deleted.
	 *
	 * @param $skin ID number for the skin
	 * @author Roger Libiez
	 * @since 2.0
	 * @return bool - true if valid, false if no
	 **/
	private function is_skin_valid( $skin )
	{
		$check_skin = $this->db->fetch( "SELECT * FROM %pskins WHERE skin_id=%d", $skin );

		if( !$check_skin )
			return false;

		if( $check_skin['skin_enabled'] == false )
			return false;

		return true;
	}

   	/**
	 * Look at the information the browser has sent and try and find a language
	 *
	 * @param $deflang Fallback language to use
	 * @author Geoffrey Dunn <geoff@warmage.com>
	 * @since 1.1.5
	 * @return character code for language to use
	 **/
	private function get_browser_lang( $deflang )
	{
		if( isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) && strlen( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) >= 2 ) {
			return substr( $_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2 );
		}
		return $deflang;
	}
}
?>