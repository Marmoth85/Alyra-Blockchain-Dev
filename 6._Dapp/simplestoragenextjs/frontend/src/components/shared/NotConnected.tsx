import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

const NotConnected = () => {
  return (
    <Alert>
        <InfoIcon />
        <AlertTitle>Warning!</AlertTitle>
        <AlertDescription>
            Please connect your account to our DApp.
        </AlertDescription>
    </Alert>
  )
}

export default NotConnected