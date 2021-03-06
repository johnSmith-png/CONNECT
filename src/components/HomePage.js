import React, {useState} from 'react';
import axios from 'axios';
// MUI Components
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
// stripe
import {useStripe, useElements, CardElement} from '@stripe/react-stripe-js';
// Util imports
import {makeStyles} from '@material-ui/core/styles';
// Custom Components
import CardInput from './CardInput';
//toast
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
//firebase
import firebase from "firebase/app"
import "firebase/auth";
import "firebase/database";



toast.configure()

const useStyles = makeStyles({
  root: {
    maxWidth: 500,
    margin: '35vh auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'flex-start',
  },
  div: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'flex-start',
    justifyContent: 'space-between',
  },
  button: {
    margin: '2em auto 1em',
  },
});

function HomePage() {
  const classes = useStyles();
  // State
  const [email, setEmail] = useState('');

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmitPay = async (event) => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const res = await axios.post('https://connect-quiz-now.herokuapp.com/pay', {email: email});

    const clientSecret = res.data['client_secret'];

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          email: email,
        },
      },
    });

    if (result.error) {
      // Show error to your customer (e.g., insufficient funds)
      console.log(result.error.message);
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        console.log('Money is in the bank!');
        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
      }
    }
  };

  const handleSubmitSub = async (event) => {
    if(JSON.parse(localStorage.getItem('user')) == null){
        toast.error('You Need To Login before Buying a Plan!')
        return
    }
    else{
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const result = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
      billing_details: {
        email: email,
      },
    });

    if (result.error) {
      console.log(result.error.message);
      toast.error(result.error.message, 'Try Again')
    } else {
      const res = await axios.post('https://connect-quiz-now.herokuapp.com/sub', {'payment_method': result.paymentMethod.id, 'email': email});
      // eslint-disable-next-line camelcase
      const {client_secret, status, customer_obj, subscription_obj} = res.data;
      console.log(JSON.parse(customer_obj).id)
      console.log(JSON.parse(subscription_obj))

      if (status === 'requires_action') {
        stripe.confirmCardPayment(client_secret).then(function(result) {
          if (result.error) {
            console.log('There was an issue!');
            console.log(result.error);
            toast.error(result.error)
            // Display error message in your UI.
            // The card was declined (i.e. insufficient funds, card has expired, etc)
          } else {
            console.log('You got the money!');
            console.log(res.data)
            toast.success("Wow so easy!")
            console.log(result)
            firebase.database().ref(`users/${JSON.parse(localStorage.getItem('user')).profileObj.googleId}`).set({
              UserName: `${JSON.parse(localStorage.getItem('user')).profileObj.givenName} ${JSON.parse(localStorage.getItem('user')).profileObj.familyName}`,
              email: JSON.parse(localStorage.getItem('user')).profileObj.email,
              planStatus: 'active',
              planDuration: 30,
              plan: 'Classroom',
              clientSecret: client_secret,
              customerObj: JSON.parse(customer_obj),
              googleObj: JSON.parse(localStorage.getItem('user')),
              subscriptionObj: JSON.parse(subscription_obj)
      
        
            })
            // Show a success message to your customer
          }
        });
      } else {
        console.log('You got the money!');
        console.log(res.data)
        toast.success("Wow so easy!")
        console.log(result)
        firebase.database().ref(`users/${JSON.parse(localStorage.getItem('user')).profileObj.googleId}`).set({
          UserName: `${JSON.parse(localStorage.getItem('user')).profileObj.givenName} ${JSON.parse(localStorage.getItem('user')).profileObj.familyName}`,
          email: JSON.parse(localStorage.getItem('user')).profileObj.email,
          planStatus: 'active',
          planDuration: 30,
          plan: 'Classroom',
          clientSecret: client_secret,
          customerObj: JSON.parse(customer_obj),
          googleObj: JSON.parse(localStorage.getItem('user')),
          subscriptionObj: JSON.parse(subscription_obj)
  
    
        })
        // No additional information was needed
        // Show a success message to your customer
      }
    }
    }
  };

  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        <TextField
          label='Email'
          id='outlined-email-input'
          helperText={`Email you'll recive updates and receipts on`}
          margin='normal'
          variant='outlined'
          type='email'
          required
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <CardInput />
        <div className={classes.div}>
          <Button variant="contained" color="primary" className={classes.button} onClick={handleSubmitSub}>
            Subscribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default HomePage;

//create-customer-portal-session
