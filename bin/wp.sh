#!/bin/zsh
# WP-CLI against the `group-block-extended` Local site. Local's MySQL listens on a socket,
# not TCP, so point mysqli at it. Recreate the symlink if Local changes the
# site id: ln -sfn "~/Library/Application Support/Local/run/1X4BG4uLs/mysql/mysqld.sock" ~/.local-sockets/group-block-extended.sock
php -d mysqli.default_socket="$HOME/.local-sockets/group-block-extended.sock" -d error_reporting="E_ALL & ~E_DEPRECATED" "$(command -v wp)" --path="$HOME/Local Sites/group-block-extended/app/public" "$@"
