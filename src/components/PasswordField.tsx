import { useState } from 'react'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

type PasswordFieldProps = Omit<TextFieldProps, 'type'>

export default function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? 'Ascunde parola' : 'Arată parola'}
                onClick={() => setVisible((v) => !v)}
                edge="end"
                size="small"
              >
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
