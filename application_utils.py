from flask import Flask, request, redirect, send_from_directory, url_for
import os
from chromedriver_py import binary_path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from PIL import Image
from io import BytesIO
from base64 import b64decode
import boto3

application = Flask(__name__, template_folder='pages')

def http_to_https():
  if request.is_secure:
    return
  if request.headers.get('X-Forwarded-Proto', '') == 'https':
    return
  return redirect(request.url.replace('http://', 'https://', 1), code=301)

def disable_caching(request):
  request.headers['Cache-Control'] = 'no-cache'
  return request

application.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
if 'RDS_DB_NAME' in os.environ: # Running on AWS
  application.config.update({
    'SQLALCHEMY_DATABASE_URI':'mysql://{user}:{pswd}@{host}:{port}/{name}'.format(
      user = os.environ['RDS_USERNAME'],
      pswd = os.environ['RDS_PASSWORD'],
      host = os.environ['RDS_HOSTNAME'],
      port = os.environ['RDS_PORT'],
      name = os.environ['RDS_DB_NAME'],
    ),
    'S3_ACCESS_KEY': os.environ['S3_ACCESS_KEY'],
    'S3_SECRET_ACCESS_KEY': os.environ['S3_SECRET_ACCESS_KEY'],
    'SECRET_KEY': os.environ['SECRET_KEY'], # CSRF secret key
  })
  application.debug = False
  # Enforce HTTPS only in the presence of a certificate
  application.before_request(http_to_https)
else: # Running locally
  application.config.update({
    'SQLALCHEMY_DATABASE_URI':'sqlite:///:memory:',
    'SECRET_KEY': 'default',
  })
  application.after_request(disable_caching)
  application.debug = True # Required to do auto-reload

def request_is_authorized():
  # Re-using the s3 key/secret key as a username/password to protect certain pages
  username = application.config.get('S3_ACCESS_KEY')
  password = application.config.get('S3_SECRET_ACCESS_KEY')
  if username is None or password is None:
    return True # No user/pass specified, allow access
  if not request.authorization:
    return False # No auth provided, block access
  if (username == request.authorization.username and
      password == request.authorization.password):
    return True # Correct user/pass provided, allow access

  return False # Default, block access

def __static_content_func(protected, filename):
  if protected and not request_is_authorized():
    # Contents, HTTP code, headers
    return '', 401, {'WWW-Authenticate': 'Basic realm=""'}

  root, file = filename.rsplit('/', 1)
  return send_from_directory(root, file)

# Recursively host folders, files, with custom paths per request.
def host_statically(path, serverpath=None, protected=False):
  path = path.replace('\\', '/')
  if os.path.isdir(path):
    for file in os.listdir(path):
      if serverpath:
        host_statically(f'{path}/{file}', f'{serverpath}/{file}')
      else:
        host_statically(f'{path}/{file}')
    return

  if not serverpath:
    serverpath = f'/{path}'
  application.add_url_rule(serverpath, f'static_{serverpath}', lambda:__static_content_func(protected, path))

def host_redirect(path, serverpath):
  application.add_url_rule(serverpath, f'redirect_{serverpath}', lambda:redirect(path))

# @Cleanup: This feels like a *very* sloppy way to fire feedback from here.
# Can I change the ownership rules so that this function lives somewhere better?
def validate_and_capture_image(puzzle_json, solution_json, add_feedback):
  options = webdriver.ChromeOptions()
  options.add_argument('headless')
  driver = webdriver.Chrome(chrome_options=options, executable_path=binary_path)
  driver.get(f'{request.url_root}validate.html')

  img_bytes = None
  try:
    # Wait for page to load, then run the script and wait for a response.
    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'puzzle')))
    driver.execute_script(f'validate_and_capture_image({to_json_string(puzzle_json)}, {to_json_string(solution_json)})')
    result = WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.ID, 'result')))
    if result.get_attribute('valid') == 'true':
      bytes = result.get_attribute('screenshot')[22:] # Remove the "data:image/png;base64," prefix
      img_bytes = BytesIO(b64decode(bytes))
    else:
      add_feedback('Validation failed, console output: ' + driver.get_log('browser'))
  except TimeoutException:
    add_feedback('Validation timed out, console output: ' + driver.get_log('browser'))
  driver.quit()
  return img_bytes

def upload_image(img_bytes, display_hash):
  name = display_hash[:2] + '/' + display_hash + '.png'
  if application.debug:
    try:
      os.mkdir(f'images/{display_hash[:2]}')
    except:
      pass
    Image.open(img_bytes).save(f'images/{name}')
    return f'images/{name}'
  else:
    boto3.client(
      's3',
      aws_access_key_id = application.config['S3_ACCESS_KEY'],
      aws_secret_access_key = application.config['S3_SECRET_ACCESS_KEY'],
    ).upload_fileobj(img_bytes, 'witnesspuzzles-images', name)
    return f'https://witnesspuzzles-images.s3.amazonaws.com/{name}'
