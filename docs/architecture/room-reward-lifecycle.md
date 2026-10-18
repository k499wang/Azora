# Room reward lifecycle

Home and SessionComplete host gift, decoration selection, placement, and room
sealing inside one `DailyRewardSurface`. These phases change the content of a
single native modal rather than presenting overlapping modals.

Keep the surface mounted when closing and set its native `visible` prop to
false. On iOS, the host's `onDismiss` is the boundary after which another popup
can present. Home holds its first-win and celebration presenters until that
event; hiding the reward's content alone does not mean its native controller
has finished dismissing. Android removes the dialog with `visible=false` and
does not supply the iOS dismissal event.

Presentation readiness resets between openings. Gift animation waits for the
current native `onShow`, not a value left over from the previous opening.

`DailyRewardFlow` accepts one placement per opening. Its synchronous commit
ref rejects queued presses before React has committed disabled controls, and
its handler checks current claim availability before starting the landing.
The server write and animation remain owned by their existing hook/component.

The legacy RoomDecorate route must disable Continue until placement finishes;
opacity from an entrance animation does not disable touch handling.
