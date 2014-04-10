angular.module('appointmentscheduling.scheduleAppointment')
    .controller('PatientAppointmentsCtrl', ['$scope', 'AppointmentService','filterFilter', 'ngGridPaginationFactory', 'dateRangePickerEventListener',
                                 function ($scope, AppointmentService, filterFilter, ngGridPaginationFactory, dateRangePickerEventListener) {
        $scope.appointmentToCancel = null;
        $scope.appointmentCancelReason = '';

        $scope.showAppointmentsGrid = false;
        $scope.filteredAppointments = [];
        $scope.allAppointments = [];
        $scope.patient = {};
        $scope.pagingOptions = {};
        $scope.fromDate = new Date();

        $scope.init = function(patientUuid, canBook) {
            $scope.patientUuid = patientUuid;
            $scope.canBook = canBook;
            $scope.findAppointments();
        },

        $scope.filterOptions = {
            filterText: "",
            useExternalFilter: true
        };

        $scope.appointmentOptions = {
            data: 'filteredAppointments',
            rowHeight: 50,
            multiSelect: false,
            enableSorting: false,
            selectedItems: [],
            columnDefs: [ { field: 'date', width: '19%', displayName: emr.message("appointmentschedulingui.scheduleAppointment.date"),
                cellTemplate: "<div>{{ row.getProperty(\'dateFormatted\') }}<br/>{{ row.getProperty(\'startTimeFormatted\') }} - {{ row.getProperty(\'endTimeFormatted\') }}<div>" },
                { field: 'appointmentType.display', width: '19%', displayName: emr.message("appointmentschedulingui.scheduleAppointment.serviceType") },
                { field: 'timeSlot.appointmentBlock.provider.person.display', width: '19%', displayName: emr.message("appointmentschedulingui.scheduleAppointment.provider") },
                { field: 'timeSlot.appointmentBlock.location.display', width: '19%', displayName: emr.message("appointmentschedulingui.scheduleAppointment.location") },
                { field: 'displayStatus', width: '15%', displayName: emr.message("appointmentschedulingui.scheduleAppointment.status") },
                { displayName: emr.message("appointmentschedulingui.scheduleAppointment.actions"), cellTemplate: '<span><i class="delete-item icon-remove" ng-show="canBook && isCancellable(row.getProperty(\'status\'))" ng-click="cancelAppointment(row.getProperty(\'uuid\'))" ' +
                    'title="{{ row.getProperty(\'tooltip\') }}"></i></span>'  }
            ]};


        var getSearchParams = function () {
            var params = { 'patient' : $scope.patientUuid };
            if ($scope.fromDate) { params['fromDate'] = moment($scope.fromDate).format();}
            if ($scope.toDate) { params['toDate'] = moment($scope.toDate).endOf('day').format(); }
            return params;
        };

        $scope.findAppointments = function() {
            clearPreviousResults();
            $scope.showLoadingAppointmentsGrid = true;
            $scope.showNoAppointmentsMessage = false;

            AppointmentService.getAppointments(getSearchParams()).then(function (results) {
                angular.forEach(results, function(result) {
                    result['dateFormatted'] = moment(result.timeSlot.appointmentBlock.startDate).format("DD MMM YYYY");
                    result['startTimeFormatted'] = moment(result.timeSlot.appointmentBlock.startDate).format("h:mm A");
                    result['endTimeFormatted']= moment(result.timeSlot.appointmentBlock.endDate).format("h:mm A");
                    result['tooltip'] = emr.message("appointmentschedulingui.scheduleAppointment.cancelAppointment.tooltip");
                    result['displayStatus'] = emr.message("appointmentschedulingui.scheduleAppointment.status.type." + result["status"].type.toLowerCase());
                });

                results.sort(function(a, b) {
                    if (a.timeSlot.appointmentBlock.startDate > b.timeSlot.appointmentBlock.startDate) {
                        return 1;
                    } else if (a.timeSlot.appointmentBlock.startDate < b.timeSlot.appointmentBlock.startDate) {
                        return -1;
                    } return 0;
                });

                initializeMessagesAfterSearch(results);
                $scope.pagingOptions.currentPage = 1;
                $scope.updateFilter();
            })
            .catch(function(e) {
                console.log(e);
                emr.errorMessage("appointmentschedulingui.scheduleAppointment.invalidSearchParameters");
            });
        }


        var initializeMessagesAfterSearch = function (results) {
            $scope.showLoadingAppointmentsGrid = false;
            $scope.allAppointments = results;

            if(results.length == 0) {
                $scope.showNoAppointmentsMessage = true;
                $scope.showAppointmentsGrid = false;
            } else {
                $scope.showAppointmentsGrid = true;
                $scope.showNoAppointmentsMessage = false;
            }
        };


        var clearPreviousResults = function () {
            $scope.allAppointments = [];
            $scope.filteredAppointments = [];
        };

        $scope.updateFilter = function() {
            $scope.filteredAppointments = filterFilter($scope.allAppointments, function(row) {
                return row;
            });
            updatePagination();
        }

        var updatePagination = function () {
            $scope.filteredAppointments = $scope.setPagingData($scope.filteredAppointments);
            if (!$scope.$$phase) $scope.$apply();
        }

        ngGridPaginationFactory.includePagination($scope, $scope.appointmentOptions, $scope.updateFilter);
        dateRangePickerEventListener.subscribe($scope, 'patientAppointments');

        $scope.cancelAppointment = function(uuid) {
            var eventData = {
                uuid: uuid
            };
            $scope.$broadcast('appointmentscheduling.cancelAppointment', eventData);
        }

        $scope.isCancellable = function(status) {
            // only scheduled appointments can be cancelled
            return status.type == 'SCHEDULED';
        }

        $scope.$watch(
            "fromDate",
            function(oldValue, newValue) {
                if(oldValue !== newValue) {
                    $scope.findAppointments();
                }
            }

        );

        $scope.$watch(
            "toDate",
            function(oldValue, newValue) {
                if(oldValue !== newValue) {
                    $scope.findAppointments();
                }
            }
        );

    }])





















