# Check for argument -f or --follow
if [[ $1 == "-f" || $1 == "--follow" ]]; then
  cd client-dummy/backend/app && lab up -f &
  cd client-dummy/frontend/app && lab up -f &
else
  # Run the docker-compose stack
  cd client-dummy/backend/app && lab up
  cd client-dummy/frontend/app && lab up
fi

