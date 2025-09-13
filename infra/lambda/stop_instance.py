import boto3
import os
import json

def handler(event, context):
    """
    Lambda function to stop EC2 instance
    """
    try:
        # Get instance ID from environment variable
        instance_id = os.environ['INSTANCE_ID']
        
        # Create EC2 client
        ec2_client = boto3.client('ec2')
        
        # Check current instance state
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        current_state = response['Reservations'][0]['Instances'][0]['State']['Name']
        
        print(f"Current instance state: {current_state}")
        
        # Only stop if instance is running
        if current_state == 'running':
            # Stop the instance
            response = ec2_client.stop_instances(InstanceIds=[instance_id])
            print(f"Stopping instance {instance_id}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Successfully initiated stop for instance {instance_id}',
                    'previousState': current_state
                })
            }
        else:
            print(f"Instance {instance_id} is already in state: {current_state}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Instance {instance_id} is already in state: {current_state}',
                    'currentState': current_state
                })
            }
            
    except Exception as e:
        print(f"Error stopping instance: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Failed to stop instance: {str(e)}'
            })
        }
